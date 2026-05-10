import { useTranslation } from 'react-i18next';
import type { ExamSummaryDto } from '@app/shared';

export interface SelectedDatesPanelProps {
  exams: ExamSummaryDto[];
}

export function SelectedDatesPanel({ exams }: SelectedDatesPanelProps): JSX.Element {
  const { t } = useTranslation();
  const selected = exams
    .filter((e) => e.myAvailability === true)
    .sort((l, r) =>
      l.examDate === r.examDate
        ? l.startTime.localeCompare(r.startTime)
        : l.examDate.localeCompare(r.examDate),
    );

  return (
    <aside className="rounded bg-white p-4 shadow">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
        {t('proctor.selectedDates.title')}
      </h3>
      {selected.length === 0 ? (
        <p className="text-sm text-slate-500">{t('proctor.selectedDates.empty')}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {selected.map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{e.examDate}</span>
              <span className="text-slate-600">
                {e.startTime}–{e.endTime}
              </span>
              <span className="text-xs text-slate-500">
                {t('calendar.classroomCount', { count: e.classroomCount })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
