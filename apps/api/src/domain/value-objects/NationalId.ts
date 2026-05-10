import { DomainError } from '../errors/DomainError.js';

export class NationalId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(input: string): NationalId {
    const trimmed = input.trim();
    if (!/^\d{9}$/u.test(trimmed)) {
      throw new DomainError('INVALID_NATIONAL_ID', 'National ID must be exactly 9 digits');
    }
    if (!NationalId.hasValidCheckDigit(trimmed)) {
      throw new DomainError('INVALID_NATIONAL_ID', 'National ID check digit is invalid');
    }
    return new NationalId(trimmed);
  }

  // Israeli ID Luhn-like checksum. Sum each digit; for digits at odd index multiply by 2,
  // and if the product > 9 sum its digits. Total mod 10 must be zero.
  private static hasValidCheckDigit(id: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
      const digit = Number(id[i]);
      const factor = (i % 2) + 1;
      const product = digit * factor;
      sum += product > 9 ? product - 9 : product;
    }
    return sum % 10 === 0;
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: NationalId): boolean {
    return this.value === other.value;
  }
}
