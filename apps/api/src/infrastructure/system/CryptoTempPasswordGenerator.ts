import { randomBytes } from 'node:crypto';
import { injectable } from 'tsyringe';
import type { ITempPasswordGenerator } from '../../application/ports/services/ITempPasswordGenerator.js';

// Alphabet without easily-confused glyphs (no 0/O, 1/I/L). 32 characters so
// each random byte modulo alphabet length stays uniform within ±1 bias.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@injectable()
export class CryptoTempPasswordGenerator implements ITempPasswordGenerator {
  public next(length = 6): string {
    if (length <= 0 || length > 64) {
      throw new RangeError('Temporary password length must be between 1 and 64');
    }
    const bytes = randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i += 1) {
      const byte = bytes[i] ?? 0;
      const idx = byte % ALPHABET.length;
      out += ALPHABET[idx];
    }
    return out;
  }
}
