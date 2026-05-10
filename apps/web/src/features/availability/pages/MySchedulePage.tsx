import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import enLocale from '@fullcalendar/core/locales/en-gb';
import { useGetMyScheduleQuery } from '../../proctor/proctorApi';

export function MySchedulePage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useGetMyScheduleQuery();

  const events = useMemo(() => {
    if (!data) return [];
    return data.assignments.map((a) => {
      const partner =
        a.partner === null
          ? t('proctor.mySchedule.noPartner')
          : `${a.partner.firstName} ${a.partner.lastName}`;
      const roleLabel =
        a.role === 'opener' ? t('proctor.mySchedule.opener') : t('proctor.mySchedule.regular');
      return {
        id: `${a.examId}-${a.classroomIndex}`,
        title: `${t('proctor.mySchedule.classroom', { n: a.classroomIndex + 1 })} • ${partner}`,
        start: `${a.examDate}T${a.startTime}`,
        end: `${a.examDate}T${a.endTime}`,
        backgroundColor: a.role === 'opener' ? '#0f766e' : '#1d4ed8',
        borderColor: 'transparent',
        extendedProps: { roleLabel, partner, notes: a.notes },
      };
    });
  }, [data, t]);

  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  if (events.length === 0) {
    return (
      <p className="rounded bg-white p-4 shadow text-slate-600">
        {t('proctor.mySchedule.empty')}
      </p>
    );
  }

  return (
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
        height="auto"
        allDaySlot={false}
      />
    </div>
  );
}
