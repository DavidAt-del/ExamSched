import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StaffUserDto } from '@app/shared';
import {
  useListStaffUsersQuery,
  useResetStaffPasswordMutation,
} from '../adminApi';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'confirm-reset'; user: StaffUserDto }
  | { kind: 'temp-password'; password: string };

export function UsersPage(): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useListStaffUsersQuery();
  const [resetPassword, resetState] = useResetStaffPasswordMutation();
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  const users = data?.users ?? [];

  const onConfirmReset = async (): Promise<void> => {
    if (dialog.kind !== 'confirm-reset') return;
    const out = await resetPassword(dialog.user.id).unwrap();
    setDialog({ kind: 'temp-password', password: out.temporaryPassword });
  };

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">{t('admin.users.title')}</h1>
      {users.length === 0 ? (
        <p className="rounded bg-white p-4 shadow">{t('admin.users.empty')}</p>
      ) : (
        <div className="overflow-hidden rounded bg-white shadow">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-100">
              <tr>
                <Th>{t('admin.users.table.name')}</Th>
                <Th>{t('admin.users.table.email')}</Th>
                <Th>{t('admin.users.table.status')}</Th>
                <Th>{t('admin.users.table.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <Td>
                    {u.firstName} {u.lastName}
                  </Td>
                  <Td>{u.email ?? '—'}</Td>
                  <Td>{u.active ? t('common.active') : t('common.inactive')}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setDialog({ kind: 'confirm-reset', user: u })}
                      className="text-blue-700 hover:underline"
                    >
                      {t('admin.users.actions.resetPassword')}
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog.kind === 'confirm-reset' ? (
        <ConfirmDialog
          title={t('admin.users.resetConfirm.title')}
          description={t('admin.users.resetConfirm.description', {
            name: `${dialog.user.firstName} ${dialog.user.lastName}`,
          })}
          confirmLabel={t('admin.users.actions.resetPassword')}
          variant="primary"
          isBusy={resetState.isLoading}
          onConfirm={onConfirmReset}
          onCancel={() => setDialog({ kind: 'closed' })}
        />
      ) : null}

      {dialog.kind === 'temp-password' ? (
        <ConfirmDialog
          title={t('admin.users.actions.resetPassword')}
          description={t('admin.proctors.resetPasswordResult', {
            password: dialog.password,
          })}
          confirmLabel={t('common.close')}
          variant="primary"
          onConfirm={() => setDialog({ kind: 'closed' })}
          onCancel={() => setDialog({ kind: 'closed' })}
        />
      ) : null}
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }): JSX.Element {
  return <th className="px-3 py-2 text-start font-medium">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }): JSX.Element {
  return <td className="px-3 py-2">{children}</td>;
}
