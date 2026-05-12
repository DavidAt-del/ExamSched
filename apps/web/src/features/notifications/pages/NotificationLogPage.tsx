import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { NotificationStatus } from '@app/shared';
import { useGetNotificationLogQuery } from '../notificationsApi';

const PAGE_SIZE = 50;

export function NotificationLogPage(): JSX.Element {
  const { t } = useTranslation();
  const { periodId = '' } = useParams<{ periodId: string }>();
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError } = useGetNotificationLogQuery(
    { periodId, limit: PAGE_SIZE, offset },
    { skip: periodId.length === 0 },
  );

  if (periodId.length === 0) return <p className="p-4">{t('common.error')}</p>;
  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">{t('admin.notificationLog.title')}</h1>

      {entries.length === 0 ? (
        <p className="rounded bg-white p-4 shadow text-slate-600">
          {t('admin.notificationLog.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-start">{t('admin.notificationLog.table.sentAt')}</th>
                <th className="px-3 py-2 text-start">{t('admin.notificationLog.table.recipient')}</th>
                <th className="px-3 py-2 text-start">{t('admin.notificationLog.table.nationalId')}</th>
                <th className="px-3 py-2 text-start">{t('admin.notificationLog.table.channel')}</th>
                <th className="px-3 py-2 text-start">{t('admin.notificationLog.table.status')}</th>
                <th className="px-3 py-2 text-start">{t('admin.notificationLog.table.error')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    {e.sentAt === null ? '—' : new Date(e.sentAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{e.nationalId}</td>
                  <td className="px-3 py-2">{t(`admin.notificationLog.channel.${e.channel}`)}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-red-700">{e.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-600">
          {t('admin.notificationLog.pagination.info', {
            from: total === 0 ? 0 : offset + 1,
            to: Math.min(offset + PAGE_SIZE, total),
            total,
          })}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            {t('admin.notificationLog.pagination.prev')}
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            {t('admin.notificationLog.pagination.next')}
          </button>
        </div>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: NotificationStatus }): JSX.Element {
  const { t } = useTranslation();
  const cls =
    status === NotificationStatus.Sent
      ? 'bg-emerald-100 text-emerald-800'
      : status === NotificationStatus.Failed
        ? 'bg-red-100 text-red-800'
        : 'bg-slate-200 text-slate-800';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {t(`admin.notificationLog.status.${status}`)}
    </span>
  );
}
