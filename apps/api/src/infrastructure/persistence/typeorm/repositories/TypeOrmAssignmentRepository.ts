import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type { IAssignmentRepository } from '../../../../application/ports/repositories/IAssignmentRepository.js';
import type { Assignment } from '../../../../domain/entities/Assignment.js';
import { AssignmentOrmEntity } from '../entities/AssignmentOrmEntity.js';
import { ExamOrmEntity } from '../entities/ExamOrmEntity.js';
import { AssignmentMapper } from '../mappers/AssignmentMapper.js';

@injectable()
export class TypeOrmAssignmentRepository implements IAssignmentRepository {
  private readonly repo: Repository<AssignmentOrmEntity>;
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.repo = dataSource.getRepository(AssignmentOrmEntity);
  }

  public async findByExam(examId: string): Promise<Assignment[]> {
    const rows = await this.repo
      .createQueryBuilder('a')
      .where('a.exam_id = :examId', { examId })
      .orderBy('a.classroom_index', 'ASC')
      .getMany();
    return rows.map(AssignmentMapper.toDomain);
  }

  public async findByPeriod(periodId: string): Promise<Assignment[]> {
    const rows = await this.repo
      .createQueryBuilder('a')
      .innerJoin(ExamOrmEntity, 'e', 'e.id = a.exam_id')
      .where('e.period_id = :periodId', { periodId })
      .orderBy('e.exam_date', 'ASC')
      .addOrderBy('a.classroom_index', 'ASC')
      .getMany();
    return rows.map(AssignmentMapper.toDomain);
  }

  public async findByUser(userId: string): Promise<Assignment[]> {
    const rows = await this.repo
      .createQueryBuilder('a')
      .where('a.opener_user_id = :userId OR a.regular_user_id = :userId', { userId })
      .getMany();
    return rows.map(AssignmentMapper.toDomain);
  }

  public async hasFutureForUser(userId: string, fromDate: Date): Promise<boolean> {
    const isoDate = fromDate.toISOString().slice(0, 10);
    const count = await this.repo
      .createQueryBuilder('a')
      .innerJoin(ExamOrmEntity, 'e', 'e.id = a.exam_id')
      .where('(a.opener_user_id = :userId OR a.regular_user_id = :userId)', { userId })
      .andWhere('e.exam_date >= :isoDate', { isoDate })
      .getCount();
    return count > 0;
  }

  public async replaceForExam(examId: string, assignments: Assignment[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(AssignmentOrmEntity, { examId });
      if (assignments.length === 0) return;
      const rows = assignments.map((a) => {
        const row = new AssignmentOrmEntity();
        AssignmentMapper.toOrm(a, row);
        return row;
      });
      await manager.save(AssignmentOrmEntity, rows);
    });
  }

  public async saveOne(assignment: Assignment): Promise<void> {
    const existing = await this.repo.findOne({ where: { id: assignment.id } });
    const target = existing ?? this.repo.create();
    AssignmentMapper.toOrm(assignment, target);
    await this.repo.save(target);
  }
}
