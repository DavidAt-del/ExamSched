import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface ConfirmDialogProps {
  /** Translated heading shown to the user. Must explicitly describe the action. */
  title: string;
  /** Translated body describing the consequence of confirming. */
  description: string;
  /** Text for the destructive/confirming button. Defaults to common.confirm. */
  confirmLabel?: string;
  /** Variant for the confirm button — destructive uses red. */
  variant?: 'destructive' | 'primary';
  isBusy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  variant = 'destructive',
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const confirmClass =
    variant === 'destructive'
      ? 'rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50'
      : 'rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
        <h2 id={titleId} className="mb-2 text-lg font-semibold">
          {title}
        </h2>
        <p id={descriptionId} className="mb-4 text-sm text-slate-700">
          {description}
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-3 py-1.5"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void onConfirm()}
            className={confirmClass}
          >
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
