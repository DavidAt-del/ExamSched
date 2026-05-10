import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import enLocale from '@fullcalendar/core/locales/en-gb';
import type { AssignmentDto, ScheduleViewExamDto } from '@app/shared';
import {
  useGetScheduleQuery,
  useRunSchedulerMutation,
} from '../schedulingApi';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { ManualOverrideDrawer } from '../components/ManualOverrideDrawer';

interface ClassroomEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    examId: string;
    classroomIndex: number;
    assignment: AssignmentDto | null;
  };
}

function statusColor(a: AssignmentDto | null): string {
  if (a === null) return '#dc2626'; // unfilled — red
  if (a.regular === null) return '#f59e0b'; // solo opener / fallback — amber
  return '#16a34a'; // opener + regular — green
}

function eventTitle(
  exam: ScheduleViewExamDto,
  classroomIndex: number,
  a: AssignmentDto | null,
): string {
  const room = `${classroomIndex + 1}`;
  if (a === null) return `${room} • —`;
  const opener = `${a.opener.firstName} ${a.opener.lastName}`;
  const regular =
    a.regular === null ? '?' : `${a.regular.firstName} ${a.regular.lastName}`;
  return `${room} • ${opener} / ${regular}`;
}

export function SchedulePage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const { periodId = '' } = useParams<{ periodId: string }>();
  const { data, isLoading, isError, refetch } = useGetScheduleQuery(periodId, {
    skip: periodId.length === 0,
  });
  const [runScheduler, runState] = useRunSchedulerMutation();
  const [confirmRun, setConfirmRun] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<{
    examId: string;
    classroomIndex: number;
    current: AssignmentDto | null;
  } | null>(null);

  const events = useMemo<ClassroomEvent[]>(() => {
    if (!data) return [];
    const result: ClassroomEvent[] = [];
    for (const exam of data.exams) {
      const byIndex = new Map<number, AssignmentDto>();
      for (const a of exam.assignments) byIndex.set(a.classroomIndex, a);
      for (let i = 0; i < exam.classroomCount; i += 1) {
        const a = byIndex.get(i) ?? null;
        result.push({
          id: `${exam.id}-${i}`,
          title: eventTitle(exam, i, a),
          start: `${exam.examDate}T${exam.startTime}`,
          end: `${exam.examDate}T${exam.endTime}`,
          backgroundColor: statusColor(a),
          borderColor: 'transparent',
          extendedProps: {
            examId: exam.id,
            classroomIndex: i,
            assignment: a,
          },
        });
      }
    }
    return result;
  }, [data]);

  if (periodId.length === 0) return <p className="p-4">{t('common.error')}</p>;
  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  const exportHref = `/api/admin/periods/${periodId}/schedule/export`;

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t('admin.scheduling.title')}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmRun(true)}
            className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
          >
            {t('admin.scheduling.run')}
          </button>
          <a
            href={exportHref}
            className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
          >
            {t('admin.scheduling.export')}
          </a>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="rounded bg-white p-4 shadow">
          {t('admin.scheduling.empty')}
        </p>
      ) : (
        <div className="rounded bg-white p-4 shadow">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            direction="rtl"
            locales={[heLocale, enLocale]}
            locale={i18n.language === 'he' ? 'he' : 'en-gb'}
            headerToolbar={{
              start: 'timeGridWeek,dayGridMonth',
              center: 'title',
              end: 'today prev,next',
            }}
            events={events}
            eventClick={(arg) => {
              const props = arg.event.extendedProps as ClassroomEvent['extendedProps'];
              setDrawerTarget({
                examId: props.examId,
                classroomIndex: props.classroomIndex,
                current: props.assignment,
              });
            }}
            height="auto"
            allDaySlot={false}
          />
        </div>
      )}

      {confirmRun ? (
        <ConfirmDialog
          title={t('admin.scheduling.runConfirm.title')}
          description={t('admin.scheduling.runConfirm.description')}
          confirmLabel={t('admin.scheduling.run')}
          variant="primary"
          isBusy={runState.isLoading}
          onConfirm={async () => {
            await runScheduler(periodId).unwrap();
            setConfirmRun(false);
            void refetch();
          }}
          onCancel={() => setConfirmRun(false)}
        />
      ) : null}

      {drawerTarget !== null ? (
        <ManualOverrideDrawer
          examId={drawerTarget.examId}
          classroomIndex={drawerTarget.classroomIndex}
          current={drawerTarget.current}
          onClose={() => {
            setDrawerTarget(null);
            void refetch();
          }}
        />
      ) : null}
    </main>
  );
}
