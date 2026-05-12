import { useTranslation } from 'react-i18next';
import type { ExamSummaryDto } from '@app/shared';
import { formatDDMMYYYY } from '../../../shared/utils/formatDate';

export interface SelectedDatesPanelProps {
  exams: ExamSummaryDto[];
}

export function SelectedDatesPanel({ exams }: SelectedDatesPanelProps): JSX.Element {
  const { t } = useTranslation();

  // Sort all exams by date then time, show all (not just selected)
  const sorted = exams.slice().sort((l, r) =>
    l.examDate === r.examDate
      ? l.startTime.localeCompare(r.startTime)
      : l.examDate.localeCompare(r.examDate),
  );

  return (
    <aside className="rounded bg-white p-4 shadow">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
        {t('proctor.selectedDates.title')}
      </h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">{t('proctor.selectedDates.empty')}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {sorted.map((e) => {
            let statePill: { label: string; icon: string; bgClass: string };
            if (e.myAvailability === true) {
              statePill = {
                label: t('calendar.available'),
                icon: '✓',
                bgClass: 'bg-green-100 text-green-700',
              };
            } else if (e.myAvailability === false) {
              statePill = {
                label: t('calendar.unavailable'),
                icon: '✗',
                bgClass: 'bg-slate-200 text-slate-600',
              };
            } else {
              statePill = {
                label: t('proctor.selectedDates.notChosen'),
                icon: '–',
                bgClass: 'border border-slate-300 text-slate-600',
              };
            }
            return (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{formatDDMMYYYY(e.examDate)}</div>
                  <div className="text-xs text-slate-500">
                    {e.startTime}–{e.endTime}
                  </div>
                </div>
                <span
                  className={`inline-block me-2 rounded px-1.5 py-0.5 text-xs font-medium ${statePill.bgClass}`}
                  title={statePill.label}
                >
                  {statePill.icon}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
