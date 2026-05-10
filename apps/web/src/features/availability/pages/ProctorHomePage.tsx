import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import enLocale from '@fullcalendar/core/locales/en-gb';
import {
  ExamPeriodStatus,
  type ExamSummaryDto,
  type MyPeriodDto,
} from '@app/shared';
import {
  useGetMyPeriodsQuery,
  useSubmitAvailabilityMutation,
} from '../../proctor/proctorApi';
import { SelectedDatesPanel } from '../components/SelectedDatesPanel';
import { SubmitAvailabilityButton } from '../components/SubmitAvailabilityButton';
import { MySchedulePage } from './MySchedulePage';

type Tab = 'availability' | 'schedule';

export function ProctorHomePage(): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetMyPeriodsQuery();
  const [tab, setTab] = useState<Tab>('availability');

  const periods = data?.periods ?? [];
  // Show the schedule tab whenever any period is sent — that's where the
  // proctor sees their assignments.
  const hasSentSchedule = periods.some((p) => p.status === ExamPeriodStatus.Sent);

  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <TabButton active={tab === 'availability'} onClick={() => setTab('availability')}>
          {t('proctor.tabs.availability')}
        </TabButton>
        {hasSentSchedule ? (
          <TabButton active={tab === 'schedule'} onClick={() => setTab('schedule')}>
            {t('proctor.tabs.schedule')}
          </TabButton>
        ) : null}
      </div>

      {tab === 'availability' ? (
        <AvailabilityView periods={periods} />
      ) : (
        <MySchedulePage />
      )}
    </main>
  );
}

function TabButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded px-3 py-1.5 text-sm ${
        props.active
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100'
      }`}
    >
      {props.children}
    </button>
  );
}

function AvailabilityView({ periods }: { periods: MyPeriodDto[] }): JSX.Element {
  const { t } = useTranslation();
  // Surface the open period (if any) for the calendar; remaining periods
  // render as compact summary cards below.
  const openPeriod = periods.find((p) => p.status === ExamPeriodStatus.Open) ?? null;

  return (
    <div className="space-y-4">
      {openPeriod ? (
        <PeriodPanel period={openPeriod} />
      ) : (
        <p className="rounded bg-white p-4 shadow">{t('calendar.noExams')}</p>
      )}

      {periods
        .filter((p) => p.id !== openPeriod?.id)
        .map((p) => (
          <article key={p.id} className="rounded bg-white p-3 text-sm shadow">
            <header className="flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                {t(`admin.periods.status.${p.status}`)}
              </span>
            </header>
          </article>
        ))}
    </div>
  );
}

function PeriodPanel({ period }: { period: MyPeriodDto }): JSX.Element {
  const { t, i18n } = useTranslation();
  const [submitOne, submitState] = useSubmitAvailabilityMutation();
  const exams = period.exams;
  const hasSelections = exams.some((e) => e.myAvailability === true);

  const events = useMemo(
    () =>
      exams.map((e) => ({
        id: e.id,
        title:
          e.myAvailability === true
            ? t('calendar.available')
            : e.myAvailability === false
              ? t('calendar.unavailable')
              : t('calendar.classroomCount', { count: e.classroomCount }),
        start: `${e.examDate}T${e.startTime}`,
        end: `${e.examDate}T${e.endTime}`,
        backgroundColor:
          e.myAvailability === true
            ? '#16a34a'
            : e.myAvailability === false
              ? '#94a3b8'
              : '#0f172a',
        borderColor: 'transparent',
        extendedProps: { exam: e },
      })),
    [exams, t],
  );

  const onToggle = async (exam: ExamSummaryDto): Promise<void> => {
    if (period.submitted || submitState.isLoading) return;
    const next = exam.myAvailability === true ? false : true;
    await submitOne({ examId: exam.id, available: next }).unwrap();
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{period.name}</h2>
          <p className="text-sm text-slate-600">
            {t('admin.periods.deadline')}: {new Date(period.deadline).toLocaleString()}
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded bg-white p-4 shadow">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            direction="rtl"
            locales={[heLocale, enLocale]}
            locale={i18n.language === 'he' ? 'he' : 'en-gb'}
            headerToolbar={{
              start: 'dayGridMonth,timeGridWeek',
              center: 'title',
              end: 'today prev,next',
            }}
            events={events}
            eventClick={(arg) => {
              const exam = arg.event.extendedProps.exam as ExamSummaryDto;
              void onToggle(exam);
            }}
            height="auto"
          />
        </div>

        <div className="space-y-3">
          <SelectedDatesPanel exams={exams} />
          {period.status === ExamPeriodStatus.Open ? (
            <SubmitAvailabilityButton
              periodId={period.id}
              hasSelections={hasSelections}
              alreadySubmitted={period.submitted}
            />
          ) : (
            <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {t('proctor.periodLocked')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
