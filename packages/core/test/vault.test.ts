import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { encryptSecret, decryptSecret } from '../src/crypto/vault';

const VALID_KEY = () => crypto.randomBytes(32).toString('hex');

beforeAll(() => {
  process.env.ENCRYPTION_MASTER_KEY_HEX = VALID_KEY();
});

afterEach(() => {
  process.env.ENCRYPTION_MASTER_KEY_HEX = VALID_KEY();
});

describe('vault AES-256-GCM', () => {
  it('bolak-balik encrypt/decrypt konsisten', () => {
    const secret = 'ya29.a0AfB_byC1token dengan unicode ok & simbol !@#$%^&*()';
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it('format serialisasi iv:authTag:cipherText', () => {
    const parts = encryptSecret('x').split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12 byte IV hex
    expect(parts[1]).toHaveLength(32); // 16 byte auth tag hex
  });

  it('IV unik per enkripsi (ciphertext berbeda untuk plaintext sama)', () => {
    const a = encryptSecret('sama');
    const b = encryptSecret('sama');
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe('sama');
    expect(decryptSecret(b)).toBe('sama');
  });

  it('tamper pada ciphertext ditolak auth tag', () => {
    const [iv, tag, cipher] = encryptSecret('rahasia').split(':');
    const flipped = cipher![0] === 'a' ? `b${cipher!.slice(1)}` : `a${cipher!.slice(1)}`;
    expect(() => decryptSecret(`${iv}:${tag}:${flipped}`)).toThrow();
  });

  it('tamper pada auth tag ditolak', () => {
    const [iv, tag, cipher] = encryptSecret('rahasia').split(':');
    const badTag = tag![0] === 'f' ? `0${tag!.slice(1)}` : `f${tag!.slice(1)}`;
    expect(() => decryptSecret(`${iv}:${badTag}:${cipher}`)).toThrow();
  });

  it('dekripsi dengan kunci berbeda gagal', () => {
    const serialized = encryptSecret('rahasia');
    process.env.ENCRYPTION_MASTER_KEY_HEX = VALID_KEY();
    expect(() => decryptSecret(serialized)).toThrow();
  });

  it('malformed format dilempar error eksplisit', () => {
    expect(() => decryptSecret('hanya-satu-bagian')).toThrow('Malformed encrypted secret format.');
    expect(() => decryptSecret('a:b:')).toThrow('Malformed encrypted secret format.');
  });

  it('plaintext kosong dapat dienkripsi dan dikembalikan utuh', () => {
    expect(decryptSecret(encryptSecret(''))).toBe('');
  });

  it('master key invalid ditolak saat enkripsi dan dekripsi', () => {
    process.env.ENCRYPTION_MASTER_KEY_HEX = VALID_KEY();
    const serialized = encryptSecret('x');
    process.env.ENCRYPTION_MASTER_KEY_HEX = 'bukan-hex-valid';
    expect(() => encryptSecret('y')).toThrow(/ENCRYPTION_MASTER_KEY_HEX/);
    expect(() => decryptSecret(serialized)).toThrow(/ENCRYPTION_MASTER_KEY_HEX/);
    process.env.ENCRYPTION_MASTER_KEY_HEX = 'ab12';
    expect(() => decryptSecret(serialized)).toThrow(/ENCRYPTION_MASTER_KEY_HEX/);
  });
});
