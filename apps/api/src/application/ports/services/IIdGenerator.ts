export interface IIdGenerator {
  next(): string;
}

export const IIdGeneratorToken = Symbol.for('IIdGenerator');
