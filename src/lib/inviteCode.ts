/** Sense vocals ni caràcters ambigus (0/O, 1/I/L): els codis es dicten de viva veu. */
const ALPHABET = '23456789BCDFGHJKMNPQRSTVWXYZ';
const LENGTH = 8;

export function generateInviteCode(): string {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase();
}
