import { prisma, CloudProvider as DbProvider } from './index';
import {
  createProvider,
  encryptSecret,
  decryptSecret,
  encryptTokenSet,
  MegaProvider,
  getValidAccessToken,
  type CloudProviderId,
  type IStorageProvider,
  type RefreshedToken,
  type StorageQuota,
  type VaultRecord,
  type VaultStore,
} from "@nexusdrive/core";

export const vaultStore: VaultStore = {
  async findByAccountId(accountId: string): Promise<VaultRecord | null> {
    const row = await prisma.credentialVault.findUnique({
      where: { accountId },
      include: { account: { select: { provider: true } } },
    });
    if (!row) return null;
    return {
      accountId,
      provider: row.account.provider as CloudProviderId,
      encryptedAccessToken: row.encryptedAccessToken,
      encryptedRefreshToken: row.encryptedRefreshToken,
      tokenExpiresAt: row.tokenExpiresAt,
    };
  },
  async updateTokens(accountId, patch) {
    await prisma.credentialVault.update({
      where: { accountId },
      data: {
        ...(patch.encryptedAccessToken ? { encryptedAccessToken: patch.encryptedAccessToken } : {}),
        ...(patch.encryptedRefreshToken ? { encryptedRefreshToken: patch.encryptedRefreshToken } : {}),
        ...(patch.tokenExpiresAt ? { tokenExpiresAt: patch.tokenExpiresAt } : {}),
      },
    });
  },
};

export interface SaveConnectionInput {
  userId: string;
  provider: CloudProviderId;
  accountEmail: string;
  accountName?: string;
  quota: StorageQuota;
  tokens?: RefreshedToken;
  masterSecret?: string;
  meta?: Record<string, string>;
}

export async function saveConnection(input: SaveConnectionInput) {
  const account = await prisma.connectedAccount.upsert({
    where: {
      userId_provider_accountEmail: {
        userId: input.userId,
        provider: input.provider as DbProvider,
        accountEmail: input.accountEmail,
      },
    },
    update: {
      status: "active",
      accountName: input.accountName ?? undefined,
      ...(input.meta ? { providerMeta: input.meta } : {}),
      totalSpaceBytes: BigInt(input.quota.totalBytes),
      usedSpaceBytes: BigInt(input.quota.usedBytes),
      lastSyncedAt: new Date(),
    },
    create: {
      userId: input.userId,
      provider: input.provider as DbProvider,
      accountEmail: input.accountEmail,
      accountName: input.accountName,
      providerMeta: input.meta ?? undefined,
      totalSpaceBytes: BigInt(input.quota.totalBytes),
      usedSpaceBytes: BigInt(input.quota.usedBytes),
      lastSyncedAt: new Date(),
    },
  });

  const enc = input.tokens ? encryptTokenSet(input.tokens) : null;
  await prisma.credentialVault.upsert({
    where: { accountId: account.id },
    update: {
      ...(enc
        ? {
            encryptedAccessToken: enc.encryptedAccessToken,
            encryptedRefreshToken: enc.encryptedRefreshToken,
            tokenExpiresAt: enc.tokenExpiresAt,
          }
        : {}),
      ...(input.masterSecret ? { encryptedApiKey: encryptSecret(input.masterSecret) } : {}),
    },
    create: {
      accountId: account.id,
      encryptedAccessToken: enc?.encryptedAccessToken ?? null,
      encryptedRefreshToken: enc?.encryptedRefreshToken ?? null,
      tokenExpiresAt: enc?.tokenExpiresAt ?? null,
      encryptedApiKey: input.masterSecret ? encryptSecret(input.masterSecret) : null,
    },
  });

  return account;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit
const providerCache = new Map<string, { provider: IStorageProvider; expiresAt: number }>();

export function evictProviderCache(accountId?: string): void {
  if (!accountId) {
    providerCache.clear();
    return;
  }
  for (const key of providerCache.keys()) {
    if (key.endsWith(`:${accountId}`)) {
      providerCache.delete(key);
    }
  }
}

export async function getProviderForAccount(accountId: string, userId: string): Promise<IStorageProvider> {
  const cacheKey = `${userId}:${accountId}`;
  const cached = providerCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.provider;
  }

  const account = await prisma.connectedAccount.findFirst({
    where: { id: accountId, userId },
    include: { vault: true },
  });
  if (!account) throw new Error('Akun tidak ditemukan atau bukan milik Anda.');
  if (!account.vault) throw new Error('Kredensial akun belum tersimpan di vault.');

  const providerId = account.provider as CloudProviderId;
  let provider: IStorageProvider;

  if (providerId === 'mega') {
    if (!account.vault.encryptedApiKey) throw new Error('Kredensial MEGA hilang dari vault.');
    const password = decryptSecret(account.vault.encryptedApiKey);
    provider = await MegaProvider.login(account.accountEmail, password);
  } else {
    const accessToken = await getValidAccessToken(accountId, vaultStore);
    const meta = account.providerMeta as { region?: 'us' | 'eu' } | null;
    provider = createProvider(providerId, { accessToken, pcloudRegion: meta?.region ?? 'us' });
  }

  providerCache.set(cacheKey, { provider, expiresAt: Date.now() + CACHE_TTL_MS });
  return provider;
}
