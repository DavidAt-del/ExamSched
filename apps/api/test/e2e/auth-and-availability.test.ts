import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { container } from 'tsyringe';
import { ExamCategory, ExamPeriodStatus, ProctorType, UserRole } from '@app/shared';
import { startTestDb, type TestDb } from '../integration/setup.js';
import { registerDependencies } from '../../src/composition/container.js';
import { buildApp } from '../../src/interfaces/http/app.js';
import { UserOrmEntity } from '../../src/infrastructure/persistence/typeorm/entities/UserOrmEntity.js';
import { ExamPeriodOrmEntity } from '../../src/infrastructure/persistence/typeorm/entities/ExamPeriodOrmEntity.js';
import { ExamOrmEntity } from '../../src/infrastructure/persistence/typeorm/entities/ExamOrmEntity.js';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

let db: TestDb;
let app: ReturnType<typeof buildApp>;

const proctorId = randomUUID();
const periodId = randomUUID();
const examId = randomUUID();

beforeAll(async () => {
  db = await startTestDb();
  // Seed: a proctor with a known password.
  const pwHash = await bcrypt.hash('123456', 12);
  await db.dataSource.getRepository(UserOrmEntity).save({
    id: proctorId,
    nationalId: '000000018',
    firstName: 'Dana',
    lastName: 'Cohen',
    email: 'dana@example.com',
    phone: null,
    passwordHash: pwHash,
    role: UserRole.Proctor,
    proctorType: ProctorType.Opener,
    mustChangePassword: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.dataSource.getRepository(ExamPeriodOrmEntity).save({
    id: periodId,
    name: 'Summer 2026',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: ExamPeriodStatus.Open,
    createdBy: proctorId, // simplification; in real life an admin
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.dataSource.getRepository(ExamOrmEntity).save({
    id: examId,
    periodId,
    examDate: '2026-06-15',
    startTime: '09:00:00',
    endTime: '12:00:00',
    classroomCount: 2,
    category: ExamCategory.Standard,
  });

  container.reset();
  registerDependencies(db.dataSource);
  app = buildApp();
}, 120_000);

afterAll(async () => {
  if (db) await db.stop();
});

describe('end-to-end: login + submit availability', () => {
  it('rejects bad credentials', async () => {
    const r = await request(app)
      .post('/api/auth/login')
      .send({ nationalId: '000000018', password: 'wrong' });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs in and submits availability', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ nationalId: '000000018', password: '123456' });
    expect(login.status).toBe(200);
    const token = login.body.token as string;
    expect(token).toBeTruthy();
    expect(login.body.user.role).toBe(UserRole.Proctor);

    const submit = await request(app)
      .post('/api/availability')
      .set('Authorization', `Bearer ${token}`)
      .send({ examId, available: true });
    expect(submit.status).toBe(200);
    expect(submit.body.available).toBe(true);
    expect(submit.body.examId).toBe(examId);

    const list = await request(app)
      .get('/api/exams/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    const mine = (list.body.exams as Array<{ id: string; myAvailability: boolean | null }>).find(
      (e) => e.id === examId,
    );
    expect(mine?.myAvailability).toBe(true);
  });
});
