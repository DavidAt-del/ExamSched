import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UserRole, ProctorType } from '@app/shared';
import { startTestDb, type TestDb } from './setup.js';
import { TypeOrmUserRepository } from '../../src/infrastructure/persistence/typeorm/repositories/TypeOrmUserRepository.js';
import { User } from '../../src/domain/entities/User.js';
import { NationalId } from '../../src/domain/value-objects/NationalId.js';

let db: TestDb;
let repo: TypeOrmUserRepository;

beforeAll(async () => {
  db = await startTestDb();
  repo = new TypeOrmUserRepository(db.dataSource);
}, 120_000);

afterAll(async () => {
  if (db) await db.stop();
});

describe('TypeOrmUserRepository', () => {
  it('saves and finds by national id', async () => {
    const user = new User({
      id: '11111111-1111-1111-1111-111111111111',
      nationalId: NationalId.create('000000018'),
      firstName: 'Dana',
      lastName: 'Cohen',
      email: 'dana@example.com',
      phone: null,
      passwordHash: 'h',
      role: UserRole.Proctor,
      proctorType: ProctorType.Opener,
      mustChangePassword: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await repo.save(user);
    const found = await repo.findByNationalId(NationalId.create('000000018'));
    expect(found).not.toBeNull();
    expect(found?.firstName).toBe('Dana');
    expect(found?.role).toBe(UserRole.Proctor);
  });
});
