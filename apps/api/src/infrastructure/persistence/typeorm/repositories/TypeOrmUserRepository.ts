import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type { IUserRepository } from '../../../../application/ports/repositories/IUserRepository.js';
import type { User } from '../../../../domain/entities/User.js';
import type { NationalId } from '../../../../domain/value-objects/NationalId.js';
import { UserOrmEntity } from '../entities/UserOrmEntity.js';
import { UserMapper } from '../mappers/UserMapper.js';

@injectable()
export class TypeOrmUserRepository implements IUserRepository {
  private readonly repo: Repository<UserOrmEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserOrmEntity);
  }

  public async findById(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  public async findByNationalId(nationalId: NationalId): Promise<User | null> {
    const row = await this.repo.findOne({ where: { nationalId: nationalId.toString() } });
    return row ? UserMapper.toDomain(row) : null;
  }

  public async save(user: User): Promise<void> {
    const existing = await this.repo.findOne({ where: { id: user.id } });
    const target = existing ?? this.repo.create();
    UserMapper.toOrm(user, target);
    await this.repo.save(target);
  }
}
