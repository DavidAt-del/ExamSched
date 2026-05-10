import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema, type LoginRequest } from '@app/shared';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../authApi';
import { useAppDispatch } from '../../../app/hooks';
import { sessionStarted } from '../authSlice';

export function LoginPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { nationalId: '', password: '' },
  });

  const onSubmit = async (values: LoginRequest): Promise<void> => {
    const res = await login(values).unwrap();
    dispatch(sessionStarted(res));
    if (res.user.mustChangePassword) {
      navigate('/change-password', { replace: true });
    } else {
      navigate('/calendar', { replace: true });
    }
  };

  const errorMessage = error ? t('login.errors.invalidCredentials') : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold">{t('login.heading')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="nationalId" className="mb-1 block text-sm font-medium">
            {t('login.nationalId')}
          </label>
          <input
            id="nationalId"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
            {...register('nationalId')}
          />
          {errors.nationalId ? (
            <p className="mt-1 text-sm text-red-600">{t('login.errors.nationalIdInvalid')}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            {t('login.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded border border-slate-300 px-3 py-2 text-base"
            {...register('password')}
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-red-600">{t('login.errors.required')}</p>
          ) : null}
        </div>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {t('login.submit')}
        </button>
      </form>
    </main>
  );
}
