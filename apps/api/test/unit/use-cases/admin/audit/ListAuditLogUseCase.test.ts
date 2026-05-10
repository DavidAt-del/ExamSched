import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListAuditLogUseCase } from '../../../../../src/application/use-cases/admin/audit/ListAuditLogUseCase.js';

describe('ListAuditLogUseCase', () => {
  let queryPort: { findPaginated: ReturnType<typeof vi.fn> };
  let useCase: ListAuditLogUseCase;

  beforeEach(() => {
    queryPort = {
      findPaginated: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 50,
      }),
    };
    useCase = new ListAuditLogUseCase(queryPort);
  });

  it('applies defaults (page=1, limit=50) when nothing is provided', async () => {
    await useCase.execute();
    expect(queryPort.findPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      from: undefined,
      to: undefined,
    });
  });

  it('clamps page to >= 1', async () => {
    await useCase.execute({ page: 0 });
    expect(queryPort.findPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
    );
    await useCase.execute({ page: -5 });
    expect(queryPort.findPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );
  });

  it('clamps limit to [1, 200]', async () => {
    await useCase.execute({ limit: 0 });
    expect(queryPort.findPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 1 }),
    );
    await useCase.execute({ limit: 9999 });
    expect(queryPort.findPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 200 }),
    );
  });

  it('passes from and to through to the query port', async () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-12-31T23:59:59Z');
    await useCase.execute({ page: 2, limit: 25, from, to });
    expect(queryPort.findPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      from,
      to,
    });
  });

  it('returns the port output directly', async () => {
    const expected = {
      items: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          actorId: null,
          actorName: null,
          action: 'scheduler.run',
          targetType: 'exam_period',
          targetId: '22222222-2222-2222-2222-222222222222',
          payload: { exams: 1 },
          createdAt: new Date('2026-05-10T10:00:00Z'),
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
    };
    queryPort.findPaginated.mockResolvedValue(expected);
    const out = await useCase.execute();
    expect(out).toBe(expected);
  });
});
