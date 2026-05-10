import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateProctorRequest, ProctorListItem } from '@app/shared';
import {
  useCreateProctorMutation,
  useDeactivateProctorMutation,
  useImportProctorsMutation,
  useListProctorsQuery,
  useResetProctorPasswordMutation,
  useUpdateProctorMutation,
} from '../adminApi';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { ProctorFormDialog } from '../components/ProctorFormDialog';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; proctor: ProctorListItem }
  | { kind: 'confirm-deactivate'; proctor: ProctorListItem }
  | { kind: 'temp-password'; password: string };

export function ProctorsPage(): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useListProctorsQuery();
  const [createProctor, createState] = useCreateProctorMutation();
  const [updateProctor, updateState] = useUpdateProctorMutation();
  const [deactivateProctor, deactivateState] = useDeactivateProctorMutation();
  const [resetPassword] = useResetProctorPasswordMutation();
  const [importProctors, importState] = useImportProctorsMutation();
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  const onCreateOrUpdate = async (values: CreateProctorRequest): Promise<void> => {
    if (dialog.kind === 'edit') {
      await updateProctor({
        id: dialog.proctor.id,
        patch: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone ?? null,
          email: values.email ?? null,
          proctorType: values.proctorType,
        },
      }).unwrap();
    } else {
      await createProctor(values).unwrap();
    }
    setDialog({ kind: 'closed' });
  };

  const onDeactivate = async (): Promise<void> => {
    if (dialog.kind !== 'confirm-deactivate') return;
    await deactivateProctor(dialog.proctor.id).unwrap();
    setDialog({ kind: 'closed' });
  };

  const onResetPassword = async (id: string): Promise<void> => {
    const out = await resetPassword(id).unwrap();
    setDialog({ kind: 'temp-password', password: out.temporaryPassword });
  };

  const onImport = async (file: File): Promise<void> => {
    const form = new FormData();
    form.append('file', file);
    await importProctors(form).unwrap();
  };

  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  const proctors = data?.proctors ?? [];

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('admin.proctors.title')}</h1>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImport(file);
                e.target.value = '';
              }}
              disabled={importState.isLoading}
            />
            {t('admin.proctors.import')}
          </label>
          <button
            type="button"
            onClick={() => setDialog({ kind: 'create' })}
            className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
          >
            {t('admin.proctors.addProctor')}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded bg-white shadow">
        <table className="w-full text-start text-sm">
          <thead className="bg-slate-100">
            <tr>
              <Th>{t('admin.proctors.table.nationalId')}</Th>
              <Th>{t('admin.proctors.table.name')}</Th>
              <Th>{t('admin.proctors.table.phone')}</Th>
              <Th>{t('admin.proctors.table.email')}</Th>
              <Th>{t('admin.proctors.table.type')}</Th>
              <Th>{t('admin.proctors.table.status')}</Th>
              <Th>{t('admin.proctors.table.actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {proctors.map((p) => (
              <tr key={p.id} className="border-t">
                <Td>{p.nationalId}</Td>
                <Td>
                  {p.firstName} {p.lastName}
                </Td>
                <Td>{p.phone ?? '—'}</Td>
                <Td>{p.email ?? '—'}</Td>
                <Td>{t(`admin.proctors.type.${p.proctorType}`)}</Td>
                <Td>{p.active ? t('common.active') : t('common.inactive')}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDialog({ kind: 'edit', proctor: p })}
                      className="text-blue-700 hover:underline"
                    >
                      {t('admin.proctors.actions.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onResetPassword(p.id)}
                      className="text-blue-700 hover:underline"
                    >
                      {t('admin.proctors.actions.resetPassword')}
                    </button>
                    {p.active ? (
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: 'confirm-deactivate', proctor: p })}
                        className="text-red-700 hover:underline"
                      >
                        {t('admin.proctors.actions.deactivate')}
                      </button>
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog.kind === 'create' || dialog.kind === 'edit' ? (
        <ProctorFormDialog
          initial={dialog.kind === 'edit' ? dialog.proctor : null}
          isBusy={createState.isLoading || updateState.isLoading}
          onSubmit={onCreateOrUpdate}
          onCancel={() => setDialog({ kind: 'closed' })}
        />
      ) : null}

      {dialog.kind === 'confirm-deactivate' ? (
        <ConfirmDialog
          title={t('admin.proctors.deactivateConfirm.title')}
          description={t('admin.proctors.deactivateConfirm.description')}
          confirmLabel={t('admin.proctors.actions.deactivate')}
          isBusy={deactivateState.isLoading}
          onConfirm={onDeactivate}
          onCancel={() => setDialog({ kind: 'closed' })}
        />
      ) : null}

      {dialog.kind === 'temp-password' ? (
        <ConfirmDialog
          title={t('admin.proctors.actions.resetPassword')}
          description={t('admin.proctors.resetPasswordResult', { password: dialog.password })}
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
