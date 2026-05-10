export interface ITempPasswordGenerator {
  /**
   * Generate a short alphanumeric temporary password. The default length
   * matches the spec's "6 characters" requirement for proctor resets.
   * Implementations must use a cryptographically secure RNG.
   */
  next(length?: number): string;
}

export const ITempPasswordGeneratorToken = Symbol.for('ITempPasswordGenerator');
