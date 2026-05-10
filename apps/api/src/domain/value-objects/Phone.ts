import { DomainError } from '../errors/DomainError.js';

// Israeli mobile / landline; allow "+" prefix and digits, 9-15 chars.
const PHONE_RE = /^\+?\d{9,15}$/u;

export class Phone {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(input: string): Phone {
    const normalized = input.replace(/[\s-]/gu, '');
    if (!PHONE_RE.test(normalized)) {
      throw new DomainError('INVALID_PHONE', 'Phone number is not valid');
    }
    return new Phone(normalized);
  }

  public toString(): string {
    return this.value;
  }
}
