import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type { IAvailabilityRepository } from '../../../../application/ports/repositories/IAvailabilityRepository.js';
import type { Availability } from '../../../../domain/entities/Availability.js';
import { AvailabilityOrmEntity } from '../entities/AvailabilityOrmEntity.js';
import { AvailabilityMapper } from '../mappers/AvailabilityMapper.js';

@injectable()
export class TypeOrmAvailabilityRepository implements IAvailabilityRepository {
  private readonly repo: Repository<AvailabilityOrmEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(AvailabilityOrmEntity);
  }

  public async findByUserAndExam(userId: string, examId: string): Promise<Availability | null> {
    const row = await this.repo.findOne({ where: { userId, examId } });
    return row ? AvailabilityMapper.toDomain(row) : null;
  }

  public async findByUser(userId: string): Promise<Availability[]> {
    const rows = await this.repo.find({ where: { userId } });
    return rows.map(AvailabilityMapper.toDomain);
  }

  public async findByExam(examId: string): Promise<Availability[]> {
    const rows = await this.repo.find({ where: { examId } });
    return rows.map(AvailabilityMapper.toDomain);
  }

  public async countAvailableForExam(examId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('a')
      .where('a.exam_id = :examId', { examId })
      .andWhere('a.available = true')
      .getCount();
  }

  public async save(availability: Availability): Promise<void> {
    const existing = await this.repo.findOne({ where: { id: availability.id } });
    const target = existing ?? this.repo.create();
    AvailabilityMapper.toOrm(availability, target);
    await this.repo.save(target);
  }
}
