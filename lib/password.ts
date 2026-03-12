import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// NOTE: environment blocks installing bcrypt package; we use strong salted scrypt hashes.
// Stored format: scrypt$<salt_hex>$<hash_hex>
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, saltHex, hashHex] = stored.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = scryptSync(password, salt, expected.length);
  return timingSafeEqual(derived, expected);
}

export function createResetToken() {
  return randomBytes(32).toString('hex');
}
