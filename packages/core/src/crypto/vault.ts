import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function masterKey(): Buffer {
  const hex = process.env.ENCRYPTION_MASTER_KEY_HEX;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY_HEX wajib berupa 64 karakter hex (32 byte). Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== KEY_LENGTH) {
    throw new Error('Master key harus 32 byte.');
  }
  return key;
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSecret(serialized: string): string {
  const [ivHex, authTagHex, cipherText] = serialized.split(':');
  if (
    !ivHex ||
    !authTagHex ||
    cipherText === undefined ||
    !/^[0-9a-fA-F]{24}$/.test(ivHex) ||
    !/^[0-9a-fA-F]{32}$/.test(authTagHex) ||
    !/^([0-9a-fA-F]{2})*$/.test(cipherText)
  ) {
    throw new Error('Malformed encrypted secret format.');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    masterKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
