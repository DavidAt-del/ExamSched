import { describe, it, expect } from 'vitest';
import { ProctorType, ExamCategory } from '@app/shared';
import { GreedySchedulingEngine } from '../../../src/infrastructure/scheduler/GreedySchedulingEngine.js';
import { Proctor } from '../../../src/domain/entities/Proctor.js';
import { Exam } from '../../../src/domain/entities/Exam.js';
function mkOpener(userId: string): Proctor {
  return new Proctor({ userId, firstName: userId, lastName: 'X', proctorType: ProctorType.Opener });
}
function mkRegular(userId: string): Proctor {
  return new Proctor({ userId, firstName: userId, lastName: 'X', proctorType: ProctorType.Regular });
}
function mkExam(classroomCount: number, id = 'exam-1', date = '2026-05-20'): Exam {
  return new Exam({
    id,
    periodId: 'period-1',
    examDate: date,
    startTime: '09:00:00',
    endTime: '11:00:00',
    classroomCount,
    category: ExamCategory.Standard,
  });
}
describe('GreedySchedulingEngine — min-pick', () => {
  it('picks the proctor with the fewest shifts first', () => {
    const engine = new GreedySchedulingEngine();
    const shiftsMap = new Map<string, number>([
      ['p-a', 3],
      ['p-b', 1],
      ['p-c', 2],
    ]);
    const result = engine.schedule({
      exam: mkExam(1),
      availableProctors: [mkOpener('p-a'), mkOpener('p-b'), mkOpener('p-c')],
      shiftsByProctor: shiftsMap,
      assignmentIds: () => 'id-1',
    });
    expect(result.assignments[0]!.openerUserId).toBe('p-b');
  });
  it('breaks ties lexicographically on userId', () => {
    const engine = new GreedySchedulingEngine();
    const shiftsMap = new Map<string, number>();
    const result = engine.schedule({
      exam: mkExam(1),
      availableProctors: [mkOpener('c-opener'), mkOpener('a-opener'), mkOpener('b-opener')],
      shiftsByProctor: shiftsMap,
      assignmentIds: () => 'id-1',
    });
    expect(result.assignments[0]!.openerUserId).toBe('a-opener');
  });
});
describe('GreedySchedulingEngine — variance minimisation', () => {
  it('distributes shifts evenly: 4 exams x 2 classrooms, 4 openers + 4 regulars', () => {
    const engine = new GreedySchedulingEngine();
    const openers = ['op-a', 'op-b', 'op-c', 'op-d'].map(mkOpener);
    const regulars = ['rg-a', 'rg-b', 'rg-c', 'rg-d'].map(mkRegular);
    const allProctors = [...openers, ...regulars];
    const shiftsByProctor = new Map<string, number>();
    let idSeq = 0;
    for (let i = 0; i < 4; i += 1) {
      const result = engine.schedule({
        exam: mkExam(2, `exam-${i}`, `2026-05-${20 + i}`),
        availableProctors: allProctors,
        shiftsByProctor,
        assignmentIds: () => `assign-${++idSeq}`,
      });
      expect(result.assignments.length).toBe(2);
      expect(result.unfilledClassrooms.length).toBe(0);
    }
    for (const op of openers) {
      expect(shiftsByProctor.get(op.userId)).toBe(2);
    }
    for (const rg of regulars) {
      expect(shiftsByProctor.get(rg.userId)).toBe(2);
    }
    const counts = Array.from(shiftsByProctor.values());
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    expect(max - min).toBeLessThanOrEqual(1);
  });
});
