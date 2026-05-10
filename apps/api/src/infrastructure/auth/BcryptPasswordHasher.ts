import bcrypt from 'bcrypt';
import { injectable } from 'tsyringe';
import type { IPasswordHasher } from '../../application/ports/services/IPasswordHasher.js';

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly cost: number) {
    if (cost < 12) {
      throw new Error('bcrypt cost must be at least 12 in production');
    }
  }

  public hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cost);
  }

  public verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
