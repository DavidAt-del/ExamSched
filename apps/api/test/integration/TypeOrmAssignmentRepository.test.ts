import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ExamPeriodStatus, UserRole, ProctorType, ExamCategory } from '@app/shared';
import { startTestDb, type TestDb } from './setup.js';
import { TypeOrmAssignmentRepository } from '../../src/infrastructure/persistence/typeorm/repositories/TypeOrmAssignmentRepository.js';
import { TypeOrmUserRepository } from '../../src/infrastructure/persistence/typeorm/repositories/TypeOrmUserRepository.js';
import { TypeOrmExamPeriodRepository } from '../../src/infrastructure/persistence/typeorm/repositories/TypeOrmExamPeriodRepository.js';
import { TypeOrmExamRepository } from '../../src/infrastructure/persistence/typeorm/repositories/TypeOrmExamRepository.js';
import { User } from '../../src/domain/entities/User.js';
import { NationalId } from '../../src/domain/value-objects/NationalId.js';
import { ExamPeriod } from '../../src/domain/entities/ExamPeriod.js';
import { Exam } from '../../src/domain/entities/Exam.js';
import { Assignment } from '../../src/domain/entities/Assignment.js';

let db: TestDb;
let assignmentRepo: TypeOrmAssignmentRepository;
let userRepo: TypeOrmUserRepository;
let periodRepo: TypeOrmExamPeriodRepository;
let examRepo: TypeOrmExamRepository;

beforeAll(async () => {
  db = await startTestDb();
  assignmentRepo = new TypeOrmAssignmentRepository(db.dataSource);
  userRepo = new TypeOrmUserRepository(db.dataSource);
  periodRepo = new TypeOrmExamPeriodRepository(db.dataSource);
  examRepo = new TypeOrmExamRepository(db.dataSource);
}, 120_000);

afterAll(async () => {
  if (db) await db.stop();
});

describe('TypeOrmAssignmentRepository', () => {
  it('hasFutureForUser returns false for open period, true for scheduled/sent', async () => {
    // Create a proctor user
    const proctorId = '22222222-2222-2222-2222-222222222222';
    const proctor = new User({
      id: proctorId,
      nationalId: NationalId.create('000000019'),
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phone: null,
      passwordHash: 'h',
      role: UserRole.Proctor,
      proctorType: ProctorType.Opener,
      mustChangePassword: false,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await userRepo.save(proctor);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const isoTomorrow = tomorrow.toISOString().slice(0, 10);

    // Create three periods: open, closed, scheduled
    const openPeriod = new ExamPeriod({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Open Period',
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: ExamPeriodStatus.Open,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    });
    await periodRepo.save(openPeriod);

    const closedPeriod = new ExamPeriod({
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Closed Period',
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: ExamPeriodStatus.Closed,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    });
    await periodRepo.save(closedPeriod);

    const scheduledPeriod = new ExamPeriod({
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Scheduled Period',
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: ExamPeriodStatus.Scheduled,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    });
    await periodRepo.save(scheduledPeriod);

    // Create exams in each period
    const openExam = new Exam({
      id: '66666666-6666-6666-6666-666666666666',
      periodId: openPeriod.id,
      examDate: isoTomorrow,
      startTime: '09:00:00',
      endTime: '11:00:00',
      classroomCount: 1,
      category: ExamCategory.Standard,
    });
    await examRepo.save(openExam);

    const closedExam = new Exam({
      id: '77777777-7777-7777-7777-777777777777',
      periodId: closedPeriod.id,
      examDate: isoTomorrow,
      startTime: '09:00:00',
      endTime: '11:00:00',
      classroomCount: 1,
      category: ExamCategory.Standard,
    });
    await examRepo.save(closedExam);

    const scheduledExam = new Exam({
      id: '88888888-8888-8888-8888-888888888888',
      periodId: scheduledPeriod.id,
      examDate: isoTomorrow,
      startTime: '09:00:00',
      endTime: '11:00:00',
      classroomCount: 1,
      category: ExamCategory.Standard,
    });
    await examRepo.save(scheduledExam);

    // Create assignments for the proctor in each exam
    const openAssignment = new Assignment({
      id: '99999999-9999-9999-9999-999999999999',
      examId: openExam.id,
      classroomIndex: 0,
      openerUserId: proctorId,
      regularUserId: null,
      manualOverride: false,
      notes: null,
    });
    await assignmentRepo.saveOne(openAssignment);

    const closedAssignment = new Assignment({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      examId: closedExam.id,
      classroomIndex: 0,
      openerUserId: proctorId,
      regularUserId: null,
      manualOverride: false,
      notes: null,
    });
    await assignmentRepo.saveOne(closedAssignment);

    const scheduledAssignment = new Assignment({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      examId: scheduledExam.id,
      classroomIndex: 0,
      openerUserId: proctorId,
      regularUserId: null,
      manualOverride: false,
      notes: null,
    });
    await assignmentRepo.saveOne(scheduledAssignment);

    // Check hasFutureForUser for each scenario
    const hasOpenFuture = await assignmentRepo.hasFutureForUser(proctorId, now);
    const hasClosedFuture = await assignmentRepo.hasFutureForUser(proctorId, now);
    const hasScheduledFuture = await assignmentRepo.hasFutureForUser(proctorId, now);

    // Open and Closed periods should return false; Scheduled should return true
    expect(hasOpenFuture).toBe(false); // open period not in ['scheduled', 'sent']
    expect(hasClosedFuture).toBe(false); // closed period not in ['scheduled', 'sent']
    expect(hasScheduledFuture).toBe(true); // scheduled period is in ['scheduled', 'sent']
  });
});

