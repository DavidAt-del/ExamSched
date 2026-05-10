import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChangePasswordRequestSchema,
  type ChangePasswordRequest,
} from '@app/shared';
import { useChangePasswordMutation } from '../authApi';
import { useAppDispatch } from '../../../app/hooks';
import { sessionEnded } from '../authSlice';

// Wire-format request shape comes from @app/shared. The form adds a
// "confirm new password" field that's validated client-side only.
const FormSchema = ChangePasswordRequestSchema.extend({
  confirmPassword: z.string().min(1),
}).refine((v) => v.newPassword === v.confirmPassword, {
  message: 'mismatch',
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof FormSchema>;

export function ChangePasswordPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [changePassword, { isLoading, error }] = useChangePasswordMutation();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues): Promise<void> => {
    const payload: ChangePasswordRequest = {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    };
    await changePassword(payload).unwrap();
    setSubmitted(true);
    // Force a clean re-login so the JWT's mustChangePassword claim is rotated.
    dispatch(sessionEnded());
    navigate('/login', { replace: true });
  };

  // 401 from the API = wrong current password.
  const status =
    error && 'status' in error && typeof error.status === 'number' ? error.status : null;
  const serverError =
    status === 401
      ? t('auth.changePassword.errors.invalidCurrent')
      : status !== null
        ? t('common.error')
        : null;

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <p className="rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          {t('auth.changePassword.success')}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold">{t('auth.changePassword.heading')}</h1>
      <p className="mb-6 text-sm text-slate-600">{t('auth.changePassword.intro')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label={t('auth.changePassword.currentPassword')}
          error={errors.currentPassword ? t('login.errors.required') : null}
        >
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
            {...register('currentPassword')}
          />
        </Field>

        <Field
          label={t('auth.changePassword.newPassword')}
          error={errors.newPassword ? t('auth.changePassword.errors.tooShort') : null}
        >
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
            {...register('newPassword')}
          />
        </Field>

        <Field
          label={t('auth.changePassword.confirmPassword')}
          error={errors.confirmPassword ? t('auth.changePassword.errors.mismatch') : null}
        >
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
            {...register('confirmPassword')}
          />
        </Field>

        {serverError !== null ? (
          <p className="text-sm text-red-600">{serverError}</p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {t('auth.changePassword.submit')}
        </button>
      </form>
    </main>
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
