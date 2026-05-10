import { describe, it, expect } from 'vitest';
import {
  CreateProctorRequestSchema,
  UpdateProctorRequestSchema,
  CreateExamPeriodRequestSchema,
  CreateExamRequestSchema,
  ProctorType,
} from '@app/shared';

describe('admin schemas', () => {
  describe('CreateProctorRequestSchema', () => {
    it('accepts a well-formed proctor', () => {
      const r = CreateProctorRequestSchema.safeParse({
        nationalId: '000000018',
        firstName: 'Dana',
        lastName: 'Cohen',
        phone: '0501234567',
        email: 'dana@example.com',
        proctorType: ProctorType.Opener,
      });
      expect(r.success).toBe(true);
    });

    it('rejects unknown role values', () => {
      const r = CreateProctorRequestSchema.safeParse({
        nationalId: '000000018',
        firstName: 'A',
        lastName: 'B',
        proctorType: 'admin',
      });
      expect(r.success).toBe(false);
    });

    it('rejects extra properties (strict)', () => {
      const r = CreateProctorRequestSchema.safeParse({
        nationalId: '000000018',
        firstName: 'A',
        lastName: 'B',
        proctorType: ProctorType.Regular,
        role: 'admin', // forbidden — would let caller change role
      });
      expect(r.success).toBe(false);
    });
  });

  describe('UpdateProctorRequestSchema', () => {
    it('all fields optional', () => {
      expect(UpdateProctorRequestSchema.safeParse({}).success).toBe(true);
    });
    it('rejects role change (not allowed)', () => {
      expect(
        UpdateProctorRequestSchema.safeParse({ role: 'admin' }).success,
      ).toBe(false);
    });
  });

  describe('CreateExamPeriodRequestSchema', () => {
    it('requires ISO datetime with offset', () => {
      expect(
        CreateExamPeriodRequestSchema.safeParse({
          name: 'Summer',
          deadline: '2026-09-01T00:00:00.000Z',
        }).success,
      ).toBe(true);
      expect(
        CreateExamPeriodRequestSchema.safeParse({
          name: 'Summer',
          deadline: '2026-09-01',
        }).success,
      ).toBe(false);
    });
  });

  describe('CreateExamRequestSchema', () => {
    it('rejects when start >= end', () => {
      const r = CreateExamRequestSchema.safeParse({
        examDate: '2026-06-15',
        startTime: '12:00',
        endTime: '12:00',
        classroomCount: 1,
      });
      expect(r.success).toBe(false);
    });
    it('rejects HH:MM:SS shape (must be HH:MM)', () => {
      const r = CreateExamRequestSchema.safeParse({
        examDate: '2026-06-15',
        startTime: '09:00:00',
        endTime: '12:00',
        classroomCount: 1,
      });
      expect(r.success).toBe(false);
    });
    it('rejects classroomCount=0', () => {
      const r = CreateExamRequestSchema.safeParse({
        examDate: '2026-06-15',
        startTime: '09:00',
        endTime: '12:00',
        classroomCount: 0,
      });
      expect(r.success).toBe(false);
    });
    it('accepts a valid request', () => {
      const r = CreateExamRequestSchema.safeParse({
        examDate: '2026-06-15',
        startTime: '09:00',
        endTime: '12:00',
        classroomCount: 4,
      });
      expect(r.success).toBe(true);
    });
  });
});
