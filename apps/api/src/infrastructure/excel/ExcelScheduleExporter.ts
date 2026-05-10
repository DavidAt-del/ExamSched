import ExcelJS from 'exceljs';
import { injectable } from 'tsyringe';
import type {
  IScheduleExporter,
  ScheduleExportInput,
} from '../../application/ports/services/IScheduleExporter.js';
import type { User } from '../../domain/entities/User.js';

@injectable()
export class ExcelScheduleExporter implements IScheduleExporter {
  public async export(input: ScheduleExportInput): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Proctor Scheduler';
    wb.created = new Date();

    const examsByDate = new Map<string, typeof input.exams>();
    for (const exam of input.exams) {
      const list = examsByDate.get(exam.examDate) ?? [];
      list.push(exam);
      examsByDate.set(exam.examDate, list);
    }

    if (examsByDate.size === 0) {
      // ExcelJS rejects an empty workbook; ship a single placeholder sheet.
      const sheet = wb.addWorksheet(input.period.name || 'Schedule');
      sheet.views = [{ rightToLeft: true }];
      sheet.addRow(['אין בחינות בתקופה זו']);
    }

    for (const [date, exams] of examsByDate) {
      const sheet = wb.addWorksheet(date);
      sheet.views = [{ rightToLeft: true }];
      sheet.columns = [
        { header: 'בחינה', key: 'exam', width: 20 },
        { header: 'כיתה', key: 'classroom', width: 8 },
        { header: 'פותח', key: 'opener', width: 32 },
        { header: 'משגיח', key: 'regular', width: 32 },
        { header: 'הערות', key: 'notes', width: 40 },
      ];
      sheet.getRow(1).font = { bold: true };

      for (const exam of exams) {
        const examLabel = `${exam.startTime.slice(0, 5)}–${exam.endTime.slice(0, 5)}`;
        const assignments = (input.assignmentsByExam.get(exam.id) ?? []).slice().sort(
          (l, r) => l.classroomIndex - r.classroomIndex,
        );

        if (assignments.length === 0) {
          sheet.addRow({
            exam: examLabel,
            classroom: '—',
            opener: '—',
            regular: '—',
            notes: 'לא הוגדרו שיבוצים',
          });
          continue;
        }

        for (const a of assignments) {
          sheet.addRow({
            exam: examLabel,
            classroom: a.classroomIndex + 1,
            opener: formatUser(input.usersById.get(a.openerUserId)),
            regular:
              a.regularUserId === null
                ? '—'
                : formatUser(input.usersById.get(a.regularUserId)),
            notes: a.notes ?? '',
          });
        }
      }
    }

    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }
}

function formatUser(user: User | undefined): string {
  if (!user) return '—';
  return `${user.firstName} ${user.lastName} (${user.nationalId.toString()})`;
}
