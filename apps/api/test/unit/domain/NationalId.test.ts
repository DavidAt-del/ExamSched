import { describe, it, expect } from 'vitest';
import { NationalId } from '../../../src/domain/value-objects/NationalId.js';
import { DomainError } from '../../../src/domain/errors/DomainError.js';

describe('NationalId', () => {
  it('accepts a valid Israeli ID', () => {
    // 000000018 has a valid checksum.
    const id = NationalId.create('000000018');
    expect(id.toString()).toBe('000000018');
  });

  it('rejects non-9-digit input', () => {
    expect(() => NationalId.create('12345')).toThrow(DomainError);
    expect(() => NationalId.create('abcdefghi')).toThrow(DomainError);
  });

  it('rejects bad check digit', () => {
    expect(() => NationalId.create('123456789')).toThrow(DomainError);
  });

  it('compares by value', () => {
    const a = NationalId.create('000000018');
    const b = NationalId.create('000000018');
    expect(a.equals(b)).toBe(true);
  });
});
