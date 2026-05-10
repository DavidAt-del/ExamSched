import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useListAuditLogQuery } from '../adminApi';

export function AuditLogPage(): JSX.Element {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const queryArg = {
    page,
    limit,
    ...(from ? { from: new Date(from).toISOString() } : {}),
    ...(to ? { to: new Date(to).toISOString() } : {}),
  };
  const { data, isLoading, isFetching, isError } = useListAuditLogQuery(queryArg);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const items = data?.items ?? [];

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">{t('admin.auditLog.title')}</h1>

      <div className="mb-3 flex flex-wrap items-end gap-2 rounded bg-white p-3 shadow">
        <Field label={t('admin.auditLog.filters.from')}>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </Field>
        <Field label={t('admin.auditLog.filters.to')}>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1"
          />
        </Field>
        <Field label={t('admin.auditLog.filters.pageSize')}>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="rounded border border-slate-300 px-2 py-1"
          >
            {[25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isLoading ? (
        <p>{t('common.loading')}</p>
      ) : isError ? (
        <p className="text-red-600">{t('common.error')}</p>
      ) : (
        <div className="overflow-hidden rounded bg-white shadow">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-100">
              <tr>
                <Th>{t('admin.auditLog.table.timestamp')}</Th>
                <Th>{t('admin.auditLog.table.actor')}</Th>
                <Th>{t('admin.auditLog.table.action')}</Th>
                <Th>{t('admin.auditLog.table.target')}</Th>
                <Th>{t('admin.auditLog.table.payload')}</Th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                    {t('admin.auditLog.empty')}
                  </td>
                </tr>
              ) : (
                items.map((entry) => (
                  <tr key={entry.id} className="border-t align-top">
                    <Td>{new Date(entry.createdAt).toLocaleString()}</Td>
                    <Td>{entry.actorName ?? t('admin.auditLog.systemActor')}</Td>
                    <Td>
                      <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                        {entry.action}
                      </code>
                    </Td>
                    <Td>
                      {entry.targetType ? (
                        <span className="text-xs">
                          {entry.targetType}
                          <br />
                          <span className="text-slate-500">{entry.targetId ?? ''}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      {entry.payload === null ? (
                        '—'
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-xs text-slate-500">
                            {t('admin.auditLog.viewPayload')}
                          </summary>
                          <pre className="mt-1 max-w-md whitespace-pre-wrap text-xs">
                            {JSON.stringify(entry.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-600">
          {t('admin.auditLog.pageInfo', { page, totalPages, total })}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
          >
            {t('admin.auditLog.prev')}
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
          >
            {t('admin.auditLog.next')}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field(props: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-0.5 text-xs text-slate-600">{props.label}</span>
      {props.children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }): JSX.Element {
  return <th className="px-3 py-2 text-start font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }): JSX.Element {
  return <td className="px-3 py-2">{children}</td>;
}
