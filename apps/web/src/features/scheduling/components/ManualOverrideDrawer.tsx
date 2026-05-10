import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ManualOverrideRequestSchema,
  ProctorType,
  type AssignmentDto,
  type ManualOverrideRequest,
} from '@app/shared';
import { useListProctorsQuery } from '../../admin/adminApi';
import { useManualOverrideAssignmentMutation } from '../schedulingApi';

export interface ManualOverrideDrawerProps {
  examId: string;
  classroomIndex: number;
  current: AssignmentDto | null;
  onClose: () => void;
}

export function ManualOverrideDrawer({
  examId,
  classroomIndex,
  current,
  onClose,
}: ManualOverrideDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const titleId = useId();
  const { data: proctorsResponse, isLoading: isProctorsLoading } = useListProctorsQuery();
  const [submit, { isLoading, error }] = useManualOverrideAssignmentMutation();
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualOverrideRequest>({
    resolver: zodResolver(ManualOverrideRequestSchema),
    defaultValues: {
      openerUserId: current?.opener.id ?? '',
      regularUserId: current?.regular?.id ?? null,
      notes: current?.notes ?? null,
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const proctors = proctorsResponse?.proctors ?? [];
  const openers = proctors.filter((p) => p.proctorType === ProctorType.Opener && p.active);
  const regulars = proctors.filter((p) => p.active);

  const onSave = async (values: ManualOverrideRequest): Promise<void> => {
    await submit({
      examId,
      classroomIndex,
      body: {
        openerUserId: values.openerUserId,
        regularUserId:
          values.regularUserId && String(values.regularUserId).length > 0
            ? values.regularUserId
            : null,
        notes:
          values.notes && String(values.notes).length > 0 ? values.notes : null,
      },
    }).unwrap();
    onClose();
  };

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === drawerRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <form
        onSubmit={handleSubmit(onSave)}
        className="w-full max-w-md space-y-3 rounded bg-white p-6 shadow-lg"
        noValidate
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {t('admin.scheduling.override.title', { classroom: classroomIndex + 1 })}
        </h2>

        {isProctorsLoading ? <p>{t('common.loading')}</p> : null}

        <Field
          label={t('admin.scheduling.override.opener')}
          error={errors.openerUserId ? t('login.errors.required') : null}
        >
          <select
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('openerUserId')}
          >
            <option value="">—</option>
            {openers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('admin.scheduling.override.regular')} error={null}>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('regularUserId')}
          >
            <option value="">{t('admin.scheduling.override.regularNone')}</option>
            {regulars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} (
                {t(`admin.proctors.type.${p.proctorType}`)})
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('admin.scheduling.override.notes')} error={null}>
          <textarea
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('notes')}
          />
        </Field>

        {error ? (
          <p className="text-sm text-red-600">{t('common.error')}</p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-3 py-1.5"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field(props: {
  label: string;
  error: string | null;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{props.label}</span>
      {props.children}
      {props.error ? <span className="text-sm text-red-600">{props.error}</span> : null}
    </label>
  );
}
