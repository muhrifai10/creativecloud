import { describe, it, expect, beforeAll, vi } from 'vitest';
import crypto from 'node:crypto';
import { encryptSecret, decryptSecret } from '../src/crypto/vault';
import { getValidAccessToken, encryptTokenSet, type VaultRecord, type VaultStore } from '../src/tokens/lifecycle';
import { exchangeCodeForToken, refreshProviderToken } from '../src/tokens/refresh';

beforeAll(() => {
  process.env.ENCRYPTION_MASTER_KEY_HEX = crypto.randomBytes(32).toString('hex');
  process.env.GOOGLE_CLIENT_ID = 'client-id.test';
  process.env.GOOGLE_CLIENT_SECRET = 'client-secret.test';
});

class MemoryVaultStore implements VaultStore {
  rows = new Map<string, VaultRecord>();
  async findByAccountId(accountId: string) {
    return this.rows.get(accountId) ?? null;
  }
  async updateTokens(accountId: string, patch: Partial<VaultRecord>) {
    const row = this.rows.get(accountId);
    if (!row) throw new Error('tidak ada');
    this.rows.set(accountId, {
      ...row,
      encryptedAccessToken: patch.encryptedAccessToken ?? row.encryptedAccessToken,
      encryptedRefreshToken: patch.encryptedRefreshToken ?? row.encryptedRefreshToken,
      tokenExpiresAt: patch.tokenExpiresAt ?? row.tokenExpiresAt,
    });
  }
}

const CIPHER_SHAPE = /^[0-9a-fA-F]{24}:[0-9a-fA-F]{32}:[0-9a-fA-F]*$/;

function seedVault(store: MemoryVaultStore, accountId: string, tokens: { access: string; refresh: string; expiresAt: Date }) {
  store.rows.set(accountId, {
    accountId,
    provider: 'google_drive',
    encryptedAccessToken: encryptSecret(tokens.access),
    encryptedRefreshToken: encryptSecret(tokens.refresh),
    tokenExpiresAt: tokens.expiresAt,
  });
}

describe('getValidAccessToken lifecycle', () => {
  it('token masih valid: di-dekripsi, tanpa refresh', async () => {
    const store = new MemoryVaultStore();
    seedVault(store, 'acc1', { access: 'TOKEN_VALID', refresh: 'R1', expiresAt: new Date(Date.now() + 3600_000) });
    const refresh = vi.fn();
    expect(await getValidAccessToken('acc1', store, { refresh })).toBe('TOKEN_VALID');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('token hampir kedaluwarsa: refresh otomatis lalu tersimpan TERENKRIPSI', async () => {
    const store = new MemoryVaultStore();
    seedVault(store, 'acc2', { access: 'TOKEN_LAMA', refresh: 'R2', expiresAt: new Date(Date.now() + 60_000) });
    const refresh = vi.fn().mockResolvedValue({ accessToken: 'TOKEN_BARU', refreshToken: 'R2_BARU', expiresIn: 3600 });

    expect(await getValidAccessToken('acc2', store, { refresh })).toBe('TOKEN_BARU');
    expect(refresh).toHaveBeenCalledWith('google_drive', 'R2');

    const row = store.rows.get('acc2')!;
    expect(row.encryptedAccessToken).toMatch(CIPHER_SHAPE);
    expect(row.encryptedRefreshToken).toMatch(CIPHER_SHAPE);
    expect(decryptSecret(row.encryptedAccessToken!)).toBe('TOKEN_BARU');
    expect(row.encryptedAccessToken).not.toContain('TOKEN_BARU');
    expect(row.tokenExpiresAt!.getTime()).toBeGreaterThan(Date.now() + 3500_000);
  });

  it('vault tanpa refresh token saat kedaluwarsa: error koneksi ulang', async () => {
    const store = new MemoryVaultStore();
    seedVault(store, 'acc3', { access: 'EXPIRED', refresh: 'R3', expiresAt: new Date(Date.now() - 1000) });
    store.rows.set('acc3', { ...store.rows.get('acc3')!, encryptedRefreshToken: null });
    await expect(getValidAccessToken('acc3', store)).rejects.toThrow('koneksi ulang');
  });

  it('akun tanpa vault: error', async () => {
    await expect(getValidAccessToken('ghost', new MemoryVaultStore())).rejects.toThrow('vault');
  });
});

describe('OAuth token exchange & refresh', () => {
  it('exchangeCodeForToken google: POST form + parse benar', async () => {
    const fetchImpl = vi.fn(async (_url: unknown, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ access_token: 'AT', refresh_token: 'RT', expires_in: 3599 }),
    })) as unknown as typeof fetch;

    const t = await exchangeCodeForToken({
      provider: 'google_drive',
      code: 'code123',
      redirectUri: 'http://localhost:3000/api/oauth/google_drive/callback',
      fetchImpl,
    });
    expect(t).toEqual({ accessToken: 'AT', refreshToken: 'RT', expiresIn: 3599 });

    const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    const body = String(calls[0]![1].body);
    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('client_id=client-id.test');
    expect(body).toContain('code=code123');
  });

  it('refreshProviderToken google: grant_type refresh_token', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: 'AT2', expires_in: 1800 }),
    })) as unknown as typeof fetch;
    const t = await refreshProviderToken('google_drive', 'RTOLD', fetchImpl);
    expect(t.accessToken).toBe('AT2');
    const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
    expect(String(calls[0]![1].body)).toContain('grant_type=refresh_token');
  });

  it('error dari endpoint token dilempar', async () => {
    const fetchImpl = (async () => ({
      ok: false,
      json: async () => ({ error: 'invalid_grant' }),
    })) as unknown as typeof fetch;
    await expect(refreshProviderToken('google_drive', 'RT', fetchImpl)).rejects.toThrow('invalid_grant');
  });

  it('mega tidak mendukung refresh', async () => {
    await expect(refreshProviderToken('mega', 'x')).rejects.toThrow('tidak');
  });
});

describe('encryptTokenSet', () => {
  it('semua token outgoing terenkripsi (tidak ada plaintext)', () => {
    const stored = encryptTokenSet({ accessToken: 'SUPER_SECRET_AT', refreshToken: 'SUPER_SECRET_RT', expiresIn: 3600 });
    expect(stored.encryptedAccessToken).toMatch(CIPHER_SHAPE);
    expect(stored.encryptedAccessToken).not.toContain('SUPER_SECRET_AT');
    expect(stored.encryptedRefreshToken).not.toContain('SUPER_SECRET_RT');
    expect(stored.tokenExpiresAt.getTime()).toBeGreaterThan(Date.now() + 3500_000);
  });
});
