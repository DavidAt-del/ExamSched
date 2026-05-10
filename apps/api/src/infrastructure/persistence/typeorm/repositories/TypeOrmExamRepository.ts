import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import { ExamPeriodStatus } from '@app/shared';
import type { IExamRepository } from '../../../../application/ports/repositories/IExamRepository.js';
import type { Exam } from '../../../../domain/entities/Exam.js';
import { ExamOrmEntity } from '../entities/ExamOrmEntity.js';
import { ExamPeriodOrmEntity } from '../entities/ExamPeriodOrmEntity.js';
import { ExamMapper } from '../mappers/ExamMapper.js';

@injectable()
export class TypeOrmExamRepository implements IExamRepository {
  private readonly repo: Repository<ExamOrmEntity>;
  private readonly periodRepo: Repository<ExamPeriodOrmEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ExamOrmEntity);
    this.periodRepo = dataSource.getRepository(ExamPeriodOrmEntity);
  }

  public async findById(id: string): Promise<Exam | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? ExamMapper.toDomain(row) : null;
  }

  public async findOpenForProctor(): Promise<Exam[]> {
    // Exams whose period is currently open. Use the QueryBuilder, never string concat.
    const rows = await this.repo
      .createQueryBuilder('e')
      .innerJoin(ExamPeriodOrmEntity, 'p', 'p.id = e.period_id')
      .where('p.status = :status', { status: ExamPeriodStatus.Open })
      .orderBy('e.exam_date', 'ASC')
      .addOrderBy('e.start_time', 'ASC')
      .getMany();
    return rows.map(ExamMapper.toDomain);
  }

  public async save(exam: Exam): Promise<void> {
    const existing = await this.repo.findOne({ where: { id: exam.id } });
    const target = existing ?? this.repo.create();
    ExamMapper.toOrm(exam, target);
    await this.repo.save(target);
  }
}
