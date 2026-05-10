import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { useFinalizeAvailabilityMutation } from '../../proctor/proctorApi';

export interface SubmitAvailabilityButtonProps {
  periodId: string;
  /** True once the user has at least one exam marked available. */
  hasSelections: boolean;
  /** True if the period already shows a submission row for this user. */
  alreadySubmitted: boolean;
}

export function SubmitAvailabilityButton({
  periodId,
  hasSelections,
  alreadySubmitted,
}: SubmitAvailabilityButtonProps): JSX.Element {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [finalize, { isLoading, error }] = useFinalizeAvailabilityMutation();

  if (alreadySubmitted) {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        {t('proctor.submit.thanks')}
      </div>
    );
  }

  // Locked-period error from the server (HTTP 423).
  const errorStatus =
    error && 'status' in error && typeof error.status === 'number'
      ? error.status
      : null;
  const lockedMessage =
    errorStatus === 423 ? t('proctor.submit.lockedError') : null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={!hasSelections || isLoading}
        onClick={() => setConfirming(true)}
        className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {t('proctor.submit.button')}
      </button>
      {lockedMessage ? (
        <p className="text-sm text-red-600">{lockedMessage}</p>
      ) : null}
      {confirming ? (
        <ConfirmDialog
          title={t('proctor.submit.confirm.title')}
          description={t('proctor.submit.confirm.description')}
          confirmLabel={t('proctor.submit.button')}
          variant="primary"
          isBusy={isLoading}
          onConfirm={async () => {
            try {
              await finalize(periodId).unwrap();
            } catch {
              // The error is surfaced via the locked banner above.
            } finally {
              setConfirming(false);
            }
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </div>
  );
}
