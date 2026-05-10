import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  useListMyExamsQuery,
  useSubmitAvailabilityMutation,
} from '../availabilityApi';
import type { ExamSummaryDto } from '@app/shared';

export function ProctorCalendarPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useListMyExamsQuery();
  const [submit, { isLoading: isSaving }] = useSubmitAvailabilityMutation();
  const [selected, setSelected] = useState<ExamSummaryDto | null>(null);

  const events = useMemo(
    () =>
      (data?.exams ?? []).map((e) => ({
        id: e.id,
        title:
          e.myAvailability === true
            ? t('calendar.available')
            : e.myAvailability === false
              ? t('calendar.unavailable')
              : `${e.classroomCount} 🏫`,
        start: `${e.examDate}T${e.startTime}`,
        end: `${e.examDate}T${e.endTime}`,
        backgroundColor:
          e.myAvailability === true ? '#16a34a' : e.myAvailability === false ? '#94a3b8' : '#0f172a',
        borderColor: 'transparent',
        extendedProps: { exam: e },
      })),
    [data, t],
  );

  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  const exams = data?.exams ?? [];

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">{t('calendar.heading')}</h1>
      {exams.length === 0 ? (
        <p className="rounded bg-white p-4 shadow">{t('calendar.noExams')}</p>
      ) : (
        <div className="rounded bg-white p-4 shadow">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            direction="rtl"
            locale={i18n.language === 'he' ? 'he' : 'en'}
            headerToolbar={{
              start: 'dayGridMonth,timeGridWeek',
              center: 'title',
              end: 'today prev,next',
            }}
            events={events}
            eventClick={(arg) => {
              const exam = arg.event.extendedProps.exam as ExamSummaryDto;
              setSelected(exam);
            }}
            height="auto"
          />
        </div>
      )}

      {selected !== null ? (
        <AvailabilityDialog
          exam={selected}
          isSaving={isSaving}
          onClose={() => setSelected(null)}
          onSave={async (available) => {
            await submit({ examId: selected.id, available }).unwrap();
            setSelected(null);
          }}
        />
      ) : null}
    </main>
  );
}

interface DialogProps {
  exam: ExamSummaryDto;
  isSaving: boolean;
  onSave: (available: boolean) => Promise<void>;
  onClose: () => void;
}

function AvailabilityDialog({ exam, isSaving, onSave, onClose }: DialogProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-sm rounded bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">
          {exam.examDate} ({t('calendar.classroomCount', { count: exam.classroomCount })})
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          {exam.startTime.slice(0, 5)}–{exam.endTime.slice(0, 5)}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-1.5"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void onSave(false)}
            className="rounded bg-slate-200 px-3 py-1.5 disabled:opacity-50"
          >
            {t('calendar.unavailable')}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void onSave(true)}
            className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
          >
            {t('calendar.available')}
          </button>
        </div>
      </div>
    </div>
  );
}
