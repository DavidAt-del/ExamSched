import { DomainError } from '../errors/DomainError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(input: string): Email {
    const normalized = input.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      throw new DomainError('INVALID_EMAIL', 'Email is not a valid address');
    }
    return new Email(normalized);
  }

  public toString(): string {
    return this.value;
  }
}
