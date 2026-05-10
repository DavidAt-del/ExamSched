import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type { IAvailabilitySubmissionRepository } from '../../../../application/ports/repositories/IAvailabilitySubmissionRepository.js';
import type { AvailabilitySubmission } from '../../../../domain/entities/AvailabilitySubmission.js';
import { AvailabilitySubmissionOrmEntity } from '../entities/AvailabilitySubmissionOrmEntity.js';
import { AvailabilitySubmissionMapper } from '../mappers/AvailabilitySubmissionMapper.js';

@injectable()
export class TypeOrmAvailabilitySubmissionRepository
  implements IAvailabilitySubmissionRepository
{
  private readonly repo: Repository<AvailabilitySubmissionOrmEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(AvailabilitySubmissionOrmEntity);
  }

  public async find(userId: string, periodId: string): Promise<AvailabilitySubmission | null> {
    const row = await this.repo.findOne({ where: { userId, periodId } });
    return row ? AvailabilitySubmissionMapper.toDomain(row) : null;
  }

  public async findByUser(userId: string): Promise<AvailabilitySubmission[]> {
    const rows = await this.repo.find({ where: { userId } });
    return rows.map(AvailabilitySubmissionMapper.toDomain);
  }

  public async save(submission: AvailabilitySubmission): Promise<void> {
    const existing = await this.repo.findOne({ where: { id: submission.id } });
    const target = existing ?? this.repo.create();
    AvailabilitySubmissionMapper.toOrm(submission, target);
    await this.repo.save(target);
  }
}
