import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProctorType } from '@app/shared';
import { ImportProctorsUseCase } from '../../../../src/application/use-cases/admin/proctor/ImportProctorsUseCase.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';
import type { ParsedProctorRow } from '../../../../src/application/ports/services/IProctorRowParser.js';

describe('ImportProctorsUseCase', () => {
  const rows: ParsedProctorRow[] = [
    {
      rowNumber: 2,
      nationalId: '000000018',
      firstName: 'Dana',
      lastName: 'Cohen',
      phone: null,
      email: null,
      proctorType: ProctorType.Opener,
    },
    {
      rowNumber: 3,
      nationalId: '111111120',
      firstName: 'Yossi',
      lastName: 'Levi',
      phone: null,
      email: null,
      proctorType: ProctorType.Regular,
    },
  ];

  let parser: { parse: ReturnType<typeof vi.fn> };
  let create: { execute: ReturnType<typeof vi.fn> };
  let useCase: ImportProctorsUseCase;

  beforeEach(() => {
    parser = { parse: vi.fn().mockResolvedValue(rows) };
    create = { execute: vi.fn() };
    // Use minimal mocks rather than the real CreateProctorUseCase, since we're
    // unit-testing aggregation behaviour, not the create logic.
    useCase = new ImportProctorsUseCase(parser, create as unknown as never);
  });

  it('counts created rows', async () => {
    create.execute.mockResolvedValue(undefined);
    const out = await useCase.execute({ actorId: 'admin', buffer: Buffer.from(''), mimeType: 'text/csv' });
    expect(out).toEqual({ created: 2, skipped: 0, errors: [] });
  });

  it('treats CONFLICT (duplicate) as skip, not error', async () => {
    create.execute
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new DomainError('CONFLICT', 'duplicate', 409));
    const out = await useCase.execute({ actorId: 'admin', buffer: Buffer.from(''), mimeType: 'text/csv' });
    expect(out).toEqual({ created: 1, skipped: 1, errors: [] });
  });

  it('records other errors with row numbers', async () => {
    create.execute
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('boom'));
    const out = await useCase.execute({ actorId: 'admin', buffer: Buffer.from(''), mimeType: 'text/csv' });
    expect(out.created).toBe(1);
    expect(out.skipped).toBe(0);
    expect(out.errors[0]).toMatch(/Row 3:/);
  });
});
