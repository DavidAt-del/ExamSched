import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type { IExamPeriodRepository } from '../../../../application/ports/repositories/IExamPeriodRepository.js';
import type { ExamPeriod } from '../../../../domain/entities/ExamPeriod.js';
import { ExamPeriodOrmEntity } from '../entities/ExamPeriodOrmEntity.js';
import { ExamPeriodMapper } from '../mappers/ExamPeriodMapper.js';

@injectable()
export class TypeOrmExamPeriodRepository implements IExamPeriodRepository {
  private readonly repo: Repository<ExamPeriodOrmEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ExamPeriodOrmEntity);
  }

  public async findById(id: string): Promise<ExamPeriod | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? ExamPeriodMapper.toDomain(row) : null;
  }

  public async save(period: ExamPeriod): Promise<void> {
    const existing = await this.repo.findOne({ where: { id: period.id } });
    const target = existing ?? this.repo.create();
    ExamPeriodMapper.toOrm(period, target);
    await this.repo.save(target);
  }
}
