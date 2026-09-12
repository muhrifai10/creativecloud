import { PrismaClient } from '@prisma/client';
import { getValidAccessToken, decryptSecret } from '@nexusdrive/core';
import { vaultStore, saveConnection } from '../src/vault-repo';

const prisma = new PrismaClient();
const CIPHER_SHAPE = /^[0-9a-fA-F]{24}:[0-9a-fA-F]{32}:[0-9a-fA-F]*$/;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`GAGAL: ${msg}`);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log(`OK: ${msg}`);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'demo@nexusdrive.test' } });
  assert(!!user, 'user demo ada (jalankan seed dahulu)');

  const email = `verify-fase2-${Date.now()}@nexusdrive.test`;
  const RAW_ACCESS = 'MENTAH_ACCESS_TOKEN_AZURE99';
  const RAW_REFRESH = 'MENTAH_REFRESH_TOKEN_B7X';

  const account = await saveConnection({
    userId: user!.id,
    provider: 'google_drive',
    accountEmail: email,
    accountName: 'Verifikasi Fase 2',
    quota: { totalBytes: 250 * 1024 ** 3, usedBytes: 120 * 1024 ** 3, freeBytes: 130 * 1024 ** 3 },
    tokens: { accessToken: RAW_ACCESS, refreshToken: RAW_REFRESH, expiresIn: 3600 },
  });

  const rows = await prisma.$queryRawUnsafe<{ enc_a: string; enc_r: string }[]>(
    `SELECT encrypted_access_token AS enc_a, encrypted_refresh_token AS enc_r
     FROM credential_vault WHERE account_id = $1::uuid`,
    account.id,
  );
  const vaultRow = rows[0]!;
  assert(CIPHER_SHAPE.test(vaultRow.enc_a), 'encrypted_access_token mengikuti format iv:authTag:cipher');
  assert(CIPHER_SHAPE.test(vaultRow.enc_r), 'encrypted_refresh_token mengikuti format iv:authTag:cipher');
  assert(!vaultRow.enc_a.includes(RAW_ACCESS) && !vaultRow.enc_r.includes(RAW_REFRESH), 'tidak ada token mentah di kolom vault');
  const anywhere = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*)::bigint AS n FROM credential_vault
     WHERE COALESCE(encrypted_access_token, '') LIKE '%' || $1 || '%'
        OR COALESCE(encrypted_refresh_token, '') LIKE '%' || $1 || '%'
        OR COALESCE(encrypted_api_key, '') LIKE '%' || $1 || '%'`,
    RAW_ACCESS,
  );
  assert(Number(anywhere[0]!.n) === 0, 'scan seluruh tabel vault: token mentah tidak ada di mana pun');
  assert(decryptSecret(vaultRow.enc_a) === RAW_ACCESS, 'dekripsi mengembalikan token asli (integritas GCM)');

  let at = await getValidAccessToken(account.id, vaultStore);
  assert(at === RAW_ACCESS, 'getValidAccessToken: token masih valid, tanpa refresh');

  await prisma.credentialVault.update({
    where: { accountId: account.id },
    data: { tokenExpiresAt: new Date(Date.now() + 30_000) },
  });
  at = await getValidAccessToken(account.id, vaultStore, {
    refresh: async (p, rt) => {
      assert(p === 'google_drive' && rt === RAW_REFRESH, 'refresh dipanggil dengan provider + refresh token asli');
      return { accessToken: 'TOKEN_SEGAR_YZ', refreshToken: 'REFRESH_SEGAR_W1', expiresIn: 3600 };
    },
  });
  assert(at === 'TOKEN_SEGAR_YZ', 'auto-refresh saat token hampir kedaluwarsa mengembalikan token baru');

  const after = await prisma.credentialVault.findUnique({ where: { accountId: account.id } });
  assert(CIPHER_SHAPE.test(after!.encryptedAccessToken!), 'token hasil refresh juga tersimpan terenkripsi');
  assert(!after!.encryptedAccessToken!.includes('TOKEN_SEGAR_YZ'), 'token baru tidak mentah di DB');
  assert(decryptSecret(after!.encryptedAccessToken!) === 'TOKEN_SEGAR_YZ', 'token baru dapat di-dekripsi balik');

  await prisma.connectedAccount.delete({ where: { id: account.id } });
  console.log('VERIFIKASI FASE 2 LOLOS SEMUA');
}

main().finally(() => prisma.$disconnect());
