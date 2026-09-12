import { decryptSecret, encryptSecret } from '../crypto/vault';
import { refreshProviderToken, type RefreshedToken } from './refresh';
import type { CloudProviderId } from '../providers/base.interface';

export interface VaultRecord {
  accountId: string;
  provider: CloudProviderId;
  encryptedAccessToken: string | null;
  encryptedRefreshToken: string | null;
  tokenExpiresAt: Date | null;
}

export interface VaultStore {
  findByAccountId(accountId: string): Promise<VaultRecord | null>;
  updateTokens(
    accountId: string,
    patch: { encryptedAccessToken?: string; encryptedRefreshToken?: string; tokenExpiresAt?: Date },
  ): Promise<void>;
}

const REFRESH_WINDOW_MS = 5 * 60 * 1000;

export interface TokenManagerDeps {
  refresh?: (provider: CloudProviderId, refreshToken: string) => Promise<RefreshedToken>;
}

export async function getValidAccessToken(
  accountId: string,
  store: VaultStore,
  deps: TokenManagerDeps = {},
): Promise<string> {
  const vault = await store.findByAccountId(accountId);
  if (!vault) throw new Error('Account vault not found');
  if (!vault.encryptedAccessToken) throw new Error('Vault tidak memiliki access token.');

  const expiresAt = vault.tokenExpiresAt?.getTime() ?? Infinity;
  if (expiresAt - Date.now() < REFRESH_WINDOW_MS) {
    if (!vault.encryptedRefreshToken) throw new Error('Token kedaluwarsa tanpa refresh token. Perlu koneksi ulang.');
    const refreshToken = decryptSecret(vault.encryptedRefreshToken);
    const refreshed = await (deps.refresh ?? refreshProviderToken)(vault.provider, refreshToken);

    await store.updateTokens(accountId, {
      encryptedAccessToken: encryptSecret(refreshed.accessToken),
      ...(refreshed.refreshToken ? { encryptedRefreshToken: encryptSecret(refreshed.refreshToken) } : {}),
      tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
    });
    return refreshed.accessToken;
  }

  return decryptSecret(vault.encryptedAccessToken);
}

export interface StoredTokens {
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
  tokenExpiresAt: Date;
}

export function encryptTokenSet(tokens: RefreshedToken): StoredTokens {
  return {
    encryptedAccessToken: encryptSecret(tokens.accessToken),
    encryptedRefreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
    tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
  };
}
