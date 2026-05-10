import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@app/shared';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { sessionEnded } from '../../features/auth/authSlice';

export function AppLayout(): JSX.Element {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.ExamStaff;
  const isProctor = user?.role === UserRole.Proctor;

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `rounded px-2 py-1 text-sm ${isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`;

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{t('app.title')}</h1>
            <nav className="flex items-center gap-1">
              {isProctor ? (
                <NavLink to="/calendar" className={navLinkClass}>
                  {t('app.nav.calendar')}
                </NavLink>
              ) : null}
              {isAdmin ? (
                <>
                  <NavLink to="/admin/proctors" className={navLinkClass}>
                    {t('app.nav.proctors')}
                  </NavLink>
                  <NavLink to="/admin/periods" className={navLinkClass}>
                    {t('app.nav.periods')}
                  </NavLink>
                </>
              ) : null}
            </nav>
          </div>
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
