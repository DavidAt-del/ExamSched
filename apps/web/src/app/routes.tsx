import { Navigate, Route, Routes } from 'react-router-dom';
import { UserRole } from '@app/shared';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProctorCalendarPage } from '../features/availability/pages/ProctorCalendarPage';
import { ProctorsPage } from '../features/admin/pages/ProctorsPage';
import { ExamPeriodsPage } from '../features/admin/pages/ExamPeriodsPage';
import { SchedulePage } from '../features/scheduling/pages/SchedulePage';
import { useAppSelector } from './hooks';
import { AppLayout } from '../shared/layouts/AppLayout';

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const token = useAppSelector((s) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: JSX.Element;
}): JSX.Element {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect(): JSX.Element {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role === UserRole.Admin || role === UserRole.ExamStaff) {
    return <Navigate to="/admin/proctors" replace />;
  }
  return <Navigate to="/calendar" replace />;
}

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="calendar" element={<ProctorCalendarPage />} />
        <Route
          path="admin/proctors"
          element={
            <RequireRole allowed={[UserRole.Admin, UserRole.ExamStaff]}>
              <ProctorsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/periods"
          element={
            <RequireRole allowed={[UserRole.Admin, UserRole.ExamStaff]}>
              <ExamPeriodsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/periods/:periodId/schedule"
          element={
            <RequireRole allowed={[UserRole.Admin, UserRole.ExamStaff]}>
              <SchedulePage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
