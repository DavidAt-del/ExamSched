import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { sessionEnded } from '../../features/auth/authSlice';

export function AppLayout(): JSX.Element {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">{t('app.title')}</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="text-sm">
                {user.firstName} {user.lastName}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => dispatch(sessionEnded())}
              className="rounded border border-white/30 px-3 py-1 text-sm hover:bg-white/10"
            >
              {t('app.logout')}
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
