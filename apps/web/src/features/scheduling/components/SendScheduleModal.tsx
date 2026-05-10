import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProctorRef, ScheduleViewResponse } from '@app/shared';
import { useSendSchedulesMutation } from '../../notifications/notificationsApi';

export interface SendScheduleModalProps {
  periodId: string;
  schedule: ScheduleViewResponse;
  onClose: () => void;
}

export function SendScheduleModal({
  periodId,
  schedule,
  onClose,
}: SendScheduleModalProps): JSX.Element {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [send, sendState] = useSendSchedulesMutation();
  const [result, setResult] = useState<{ sent: number; skipped: number; failed: number } | null>(
    null,
  );

  // Distinct proctors referenced as opener or regular across the period.
  const recipients = useMemo<ProctorRef[]>(() => {
    const map = new Map<string, ProctorRef>();
    for (const exam of schedule.exams) {
      for (const a of exam.assignments) {
        map.set(a.opener.id, a.opener);
        if (a.regular !== null) map.set(a.regular.id, a.regular);
      }
    }
    return [...map.values()].sort((l, r) =>
      `${l.firstName} ${l.lastName}`.localeCompare(`${r.firstName} ${r.lastName}`),
    );
  }, [schedule]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(recipients.map((r) => r.id)),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = async (): Promise<void> => {
    const userIds =
      selectedIds.size === recipients.length ? undefined : [...selectedIds];
    const out = await send({
      periodId,
      body: userIds === undefined ? {} : { userIds },
    }).unwrap();
    setResult(out);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-lg space-y-3 rounded bg-white p-6 shadow-lg">
        <h2 id={titleId} className="text-lg font-semibold">
          {t('admin.scheduling.send.title')}
        </h2>

        {result !== null ? (
          <ResultPanel result={result} onClose={onClose} />
        ) : (
          <>
            <p className="text-sm text-slate-700">
              {t('admin.scheduling.send.description')}
            </p>
            <div className="max-h-72 overflow-auto rounded border border-slate-200 p-2">
              {recipients.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t('admin.scheduling.send.noRecipients')}
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {recipients.map((p) => (
                    <li key={p.id}>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggle(p.id)}
                        />
                        <span>
                          {p.firstName} {p.lastName}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-3 py-1.5"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0 || sendState.isLoading}
                onClick={() => void onSubmit()}
                className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {t('admin.scheduling.send.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResultPanel(props: {
  result: { sent: number; skipped: number; failed: number };
  onClose: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {t('admin.scheduling.send.result', {
          sent: props.result.sent,
          skipped: props.result.skipped,
          failed: props.result.failed,
        })}
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={props.onClose}
          className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
