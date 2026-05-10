import { injectable } from 'tsyringe';
import type { EmailMessage } from '../../application/ports/services/IEmailService.js';
import type {
  IScheduleEmailBuilder,
  ScheduleEmailInput,
} from '../../application/ports/services/IScheduleEmailBuilder.js';

@injectable()
export class ScheduleEmailBuilder implements IScheduleEmailBuilder {
  public build(input: ScheduleEmailInput): EmailMessage {
    if (input.user.email === null) {
      throw new Error('Cannot build a schedule email for a user without an email address');
    }
    const sortedItems = input.items
      .slice()
      .sort((a, b) =>
        a.exam.examDate === b.exam.examDate
          ? a.exam.startTime.localeCompare(b.exam.startTime)
          : a.exam.examDate.localeCompare(b.exam.examDate),
      );

    const subject = `שיבוץ משגיחים — ${input.period.name}`;
    const greeting = `שלום ${input.user.firstName} ${input.user.lastName},`;

    const intro =
      sortedItems.length === 0
        ? 'לא שובצת לבחינות בתקופה זו.'
        : 'להלן פירוט השיבוץ שלך לתקופה הבאה. אנא וודא שהפרטים נכונים והגע במועד.';

    const rowsHtml =
      sortedItems.length === 0
        ? ''
        : sortedItems
            .map((item) => {
              const role =
                item.assignment.openerUserId === input.user.id
                  ? 'פותח כיתה'
                  : 'משגיח רגיל';
              const partnerName =
                item.partner === null
                  ? '—'
                  : `${item.partner.firstName} ${item.partner.lastName}`;
              const notes = item.assignment.notes ?? '';
              return `<tr>
                <td>${escapeHtml(item.exam.examDate)}</td>
                <td>${escapeHtml(item.exam.startTime.slice(0, 5))}–${escapeHtml(item.exam.endTime.slice(0, 5))}</td>
                <td>${item.assignment.classroomIndex + 1}</td>
                <td>${escapeHtml(role)}</td>
                <td>${escapeHtml(partnerName)}</td>
                <td>${escapeHtml(notes)}</td>
              </tr>`;
            })
            .join('\n');

    const tableHtml =
      sortedItems.length === 0
        ? ''
        : `
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; margin-top:1em; font-family:Arial,sans-serif;">
        <thead style="background:#f1f5f9;">
          <tr>
            <th>תאריך</th>
            <th>שעות</th>
            <th>כיתה</th>
            <th>תפקיד</th>
            <th>שותף לכיתה</th>
            <th>הערות</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>`;

    const htmlBody = `<!doctype html>
<html dir="rtl" lang="he">
  <head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
  <body style="font-family:Arial,sans-serif; color:#0f172a;">
    <p>${escapeHtml(greeting)}</p>
    <p>${escapeHtml(intro)}</p>
    ${tableHtml}
    <p style="margin-top:1.5em; color:#475569;">בברכה,<br/>מדור בחינות</p>
  </body>
</html>`;

    const textLines: string[] = [
      greeting,
      '',
      intro,
      '',
      ...sortedItems.map((item) => {
        const role =
          item.assignment.openerUserId === input.user.id ? 'פותח' : 'משגיח';
        const partner =
          item.partner === null
            ? '—'
            : `${item.partner.firstName} ${item.partner.lastName}`;
        return `${item.exam.examDate} ${item.exam.startTime.slice(0, 5)}–${item.exam.endTime.slice(0, 5)} | כיתה ${item.assignment.classroomIndex + 1} | ${role} | שותף: ${partner}`;
      }),
      '',
      'בברכה, מדור בחינות',
    ];

    return {
      to: input.user.email,
      subject,
      htmlBody,
      textBody: textLines.join('\n'),
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
