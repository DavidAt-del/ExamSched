import { useId, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateProctorRequestSchema,
  ProctorType,
  type CreateProctorRequest,
  type ProctorListItem,
} from '@app/shared';

export interface ProctorFormDialogProps {
  initial?: ProctorListItem | null;
  isBusy?: boolean;
  onSubmit: (values: CreateProctorRequest) => void | Promise<void>;
  onCancel: () => void;
}

export function ProctorFormDialog({
  initial,
  isBusy = false,
  onSubmit,
  onCancel,
}: ProctorFormDialogProps): JSX.Element {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const isEdit = initial !== null && initial !== undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProctorRequest>({
    resolver: zodResolver(CreateProctorRequestSchema),
    defaultValues: initial
      ? {
          nationalId: initial.nationalId,
          firstName: initial.firstName,
          lastName: initial.lastName,
          phone: initial.phone ?? '',
          email: initial.email ?? '',
          proctorType: initial.proctorType,
        }
      : {
          nationalId: '',
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          proctorType: ProctorType.Regular,
        },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-3 rounded bg-white p-6 shadow-lg"
        noValidate
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {isEdit ? t('common.edit') : t('admin.proctors.addProctor')}
        </h2>

        <Field
          label={t('login.nationalId')}
          error={errors.nationalId ? t('login.errors.nationalIdInvalid') : null}
        >
          <input
            type="text"
            inputMode="numeric"
            disabled={isEdit}
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('nationalId')}
          />
        </Field>
        <Field
          label={t('admin.proctors.form.firstName')}
          error={errors.firstName ? t('login.errors.required') : null}
        >
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('firstName')}
          />
        </Field>
        <Field
          label={t('admin.proctors.form.lastName')}
          error={errors.lastName ? t('login.errors.required') : null}
        >
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('lastName')}
          />
        </Field>
        <Field label={t('admin.proctors.form.phone')} error={null}>
          <input
            type="tel"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('phone')}
          />
        </Field>
        <Field label={t('admin.proctors.form.email')} error={null}>
          <input
            type="email"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('email')}
          />
        </Field>
        <Field label={t('admin.proctors.form.type')} error={null}>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('proctorType')}
          >
            <option value={ProctorType.Opener}>{t('admin.proctors.type.opener')}</option>
            <option value={ProctorType.Regular}>{t('admin.proctors.type.regular')}</option>
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-3 py-1.5"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isBusy}
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
