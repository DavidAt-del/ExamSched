import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { UserRole } from '@app/shared';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage';
import { ProctorHomePage } from '../features/availability/pages/ProctorHomePage';
import { ProctorsPage } from '../features/admin/pages/ProctorsPage';
import { ExamPeriodsPage } from '../features/admin/pages/ExamPeriodsPage';
import { UsersPage } from '../features/admin/pages/UsersPage';
import { AuditLogPage } from '../features/admin/pages/AuditLogPage';
import { SchedulePage } from '../features/scheduling/pages/SchedulePage';
import { NotificationLogPage } from '../features/notifications/pages/NotificationLogPage';
import { useAppSelector } from './hooks';
import { AppLayout } from '../shared/layouts/AppLayout';

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace />;
  // Force the change-password flow when the JWT carried mustChangePassword=true.
  // Without this guard, a user with a temp password could navigate directly to
  // protected routes after login and bypass the spec-mandated reset.
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
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
      {/*
       * Change-password sits outside AppLayout: it's a forced single-purpose
       * flow, so we deliberately omit the nav chrome that would let the user
       * dodge the requirement by clicking elsewhere first.
       */}
      <Route
        path="/change-password"
        element={
          <RequireAuth>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="calendar" element={<ProctorHomePage />} />
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
        <Route
          path="admin/periods/:periodId/notification-log"
          element={
            <RequireRole allowed={[UserRole.Admin, UserRole.ExamStaff]}>
              <NotificationLogPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequireRole allowed={[UserRole.Admin, UserRole.ExamStaff]}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/audit-log"
          element={
            <RequireRole allowed={[UserRole.Admin, UserRole.ExamStaff]}>
              <AuditLogPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
