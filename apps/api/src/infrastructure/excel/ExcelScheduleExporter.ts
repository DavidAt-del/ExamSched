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
      // 7 columns. Spec mandates ≥6 (classroom + opener name/id + regular
      // name/id + notes). Keeping "בחינה" (time range) as a leading column
      // preserves cross-row context within the date sheet.
      sheet.columns = [
        { header: 'בחינה', key: 'exam', width: 20 },
        { header: 'מספר כיתה', key: 'classroom', width: 10 },
        { header: 'שם פותח', key: 'openerName', width: 24 },
        { header: 'ת"ז פותח', key: 'openerId', width: 14 },
        { header: 'שם משגיח', key: 'regularName', width: 24 },
        { header: 'ת"ז משגיח', key: 'regularId', width: 14 },
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
            openerName: '—',
            openerId: '—',
            regularName: '—',
            regularId: '—',
            notes: 'לא הוגדרו שיבוצים',
          });
          continue;
        }

        for (const a of assignments) {
          const opener = input.usersById.get(a.openerUserId);
          const regular = a.regularUserId === null ? undefined : input.usersById.get(a.regularUserId);
          sheet.addRow({
            exam: examLabel,
            classroom: a.classroomIndex + 1,
            openerName: fullName(opener),
            openerId: nationalId(opener),
            regularName: a.regularUserId === null ? '–' : fullName(regular),
            regularId: a.regularUserId === null ? '–' : nationalId(regular),
            notes: a.notes ?? '',
          });
        }
      }
    }

    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }
}

function fullName(user: User | undefined): string {
  if (!user) return '–';
  return `${user.firstName} ${user.lastName}`;
}

function nationalId(user: User | undefined): string {
  if (!user) return '–';
  return user.nationalId.toString();
}
