export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export const IPasswordHasherToken = Symbol.for('IPasswordHasher');
