import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateExamPeriodRequestSchema,
  CreateExamRequestSchema,
  ExamPeriodStatus,
  type CreateExamPeriodRequest,
  type CreateExamRequest,
  type ExamPeriodDto,
} from '@app/shared';
import {
  useClosePeriodMutation,
  useCreateExamMutation,
  useCreatePeriodMutation,
  useDeleteExamMutation,
  useListExamsForPeriodQuery,
  useListPeriodsQuery,
} from '../adminApi';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'new-period' }
  | { kind: 'close-period'; period: ExamPeriodDto }
  | { kind: 'new-exam'; periodId: string }
  | { kind: 'delete-exam'; periodId: string; examId: string };

export function ExamPeriodsPage(): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useListPeriodsQuery();
  const [createPeriod, createState] = useCreatePeriodMutation();
  const [closePeriod, closeState] = useClosePeriodMutation();
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <p className="p-4">{t('common.loading')}</p>;
  if (isError) return <p className="p-4 text-red-600">{t('common.error')}</p>;

  const periods = data?.periods ?? [];

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('admin.periods.title')}</h1>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'new-period' })}
          className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
        >
          {t('admin.periods.addPeriod')}
        </button>
      </div>

      <div className="space-y-3">
        {periods.map((p) => (
          <article key={p.id} className="rounded bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="text-sm text-slate-600">
                  {t('admin.periods.deadline')}: {new Date(p.deadline).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                {p.status === ExamPeriodStatus.Open ? (
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'close-period', period: p })}
                    className="rounded border border-slate-300 px-3 py-1.5"
                  >
                    {t('common.close')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  className="rounded border border-slate-300 px-3 py-1.5"
                >
                  {expandedId === p.id ? '−' : '+'}
                </button>
              </div>
            </div>
            {expandedId === p.id ? (
              <PeriodExamsPanel
                periodId={p.id}
                canModify={p.status === ExamPeriodStatus.Open}
                onAdd={() => setDialog({ kind: 'new-exam', periodId: p.id })}
                onDelete={(examId) =>
                  setDialog({ kind: 'delete-exam', periodId: p.id, examId })
                }
              />
            ) : null}
          </article>
        ))}
      </div>

      {dialog.kind === 'new-period' ? (
        <NewPeriodDialog
          isBusy={createState.isLoading}
          onCancel={() => setDialog({ kind: 'closed' })}
          onSubmit={async (values) => {
            await createPeriod(values).unwrap();
            setDialog({ kind: 'closed' });
          }}
        />
      ) : null}

      {dialog.kind === 'close-period' ? (
        <ConfirmDialog
          title={t('admin.periods.closeConfirm.title')}
          description={t('admin.periods.closeConfirm.description')}
          confirmLabel={t('common.close')}
          isBusy={closeState.isLoading}
          onConfirm={async () => {
            await closePeriod(dialog.period.id).unwrap();
            setDialog({ kind: 'closed' });
          }}
          onCancel={() => setDialog({ kind: 'closed' })}
        />
      ) : null}

      {dialog.kind === 'new-exam' ? (
        <NewExamDialog
          periodId={dialog.periodId}
          onCancel={() => setDialog({ kind: 'closed' })}
          onDone={() => setDialog({ kind: 'closed' })}
        />
      ) : null}

      {dialog.kind === 'delete-exam' ? (
        <DeleteExamDialog
          periodId={dialog.periodId}
          examId={dialog.examId}
          onClose={() => setDialog({ kind: 'closed' })}
        />
      ) : null}
    </main>
  );
}

function StatusBadge({ status }: { status: ExamPeriodStatus }): JSX.Element {
  const { t } = useTranslation();
  const cls =
    status === ExamPeriodStatus.Open
      ? 'bg-emerald-100 text-emerald-800'
      : status === ExamPeriodStatus.Closed
        ? 'bg-slate-200 text-slate-800'
        : status === ExamPeriodStatus.Scheduled
          ? 'bg-blue-100 text-blue-800'
          : 'bg-purple-100 text-purple-800';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {t(`admin.periods.status.${status}`)}
    </span>
  );
}

function PeriodExamsPanel(props: {
  periodId: string;
  canModify: boolean;
  onAdd: () => void;
  onDelete: (examId: string) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading } = useListExamsForPeriodQuery(props.periodId);
  if (isLoading) return <p className="mt-3 text-sm">{t('common.loading')}</p>;
  const exams = data?.exams ?? [];

  return (
    <div className="mt-4 border-t pt-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{t('admin.periods.exams.title')}</h3>
        {props.canModify ? (
          <button
            type="button"
            onClick={props.onAdd}
            className="rounded bg-slate-900 px-2 py-1 text-sm text-white hover:bg-slate-700"
          >
            {t('admin.periods.exams.addExam')}
          </button>
        ) : null}
      </div>
      <table className="w-full text-sm">
        <thead className="text-slate-600">
          <tr>
            <th className="text-start font-medium">{t('admin.periods.exams.examDate')}</th>
            <th className="text-start font-medium">{t('admin.periods.exams.startTime')}</th>
            <th className="text-start font-medium">{t('admin.periods.exams.endTime')}</th>
            <th className="text-start font-medium">{t('admin.periods.exams.classroomCount')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {exams.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-1">{e.examDate}</td>
              <td className="py-1">{e.startTime}</td>
              <td className="py-1">{e.endTime}</td>
              <td className="py-1">{e.classroomCount}</td>
              <td className="py-1 text-end">
                {props.canModify ? (
                  <button
                    type="button"
                    onClick={() => props.onDelete(e.id)}
                    className="text-red-700 hover:underline"
                  >
                    {t('common.delete')}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewPeriodDialog(props: {
  isBusy: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateExamPeriodRequest) => Promise<void>;
}): JSX.Element {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExamPeriodRequest>({
    resolver: zodResolver(CreateExamPeriodRequestSchema),
    defaultValues: { name: '', deadline: '' },
  });

  return (
    <DialogShell title={t('admin.periods.addPeriod')} onCancel={props.onCancel}>
      <form
        onSubmit={handleSubmit((v) =>
          props.onSubmit({
            name: v.name,
            deadline: new Date(v.deadline).toISOString(),
          }),
        )}
        className="space-y-3"
        noValidate
      >
        <Field
          label={t('admin.periods.name')}
          error={errors.name ? t('login.errors.required') : null}
        >
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('name')}
          />
        </Field>
        <Field label={t('admin.periods.deadline')} error={null}>
          <input
            type="datetime-local"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('deadline')}
          />
        </Field>
        <DialogButtons isBusy={props.isBusy} onCancel={props.onCancel} />
      </form>
    </DialogShell>
  );
}

function NewExamDialog(props: {
  periodId: string;
  onCancel: () => void;
  onDone: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const [createExam, createState] = useCreateExamMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExamRequest>({
    resolver: zodResolver(CreateExamRequestSchema),
    defaultValues: { examDate: '', startTime: '', endTime: '', classroomCount: 1 },
  });

  return (
    <DialogShell title={t('admin.periods.exams.addExam')} onCancel={props.onCancel}>
      <form
        onSubmit={handleSubmit(async (values) => {
          await createExam({ periodId: props.periodId, body: values }).unwrap();
          props.onDone();
        })}
        className="space-y-3"
        noValidate
      >
        <Field
          label={t('admin.periods.exams.examDate')}
          error={errors.examDate ? t('login.errors.required') : null}
        >
          <input
            type="date"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('examDate')}
          />
        </Field>
        <Field
          label={t('admin.periods.exams.startTime')}
          error={errors.startTime ? t('login.errors.required') : null}
        >
          <input
            type="time"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('startTime')}
          />
        </Field>
        <Field
          label={t('admin.periods.exams.endTime')}
          error={errors.endTime ? t('login.errors.required') : null}
        >
          <input
            type="time"
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('endTime')}
          />
        </Field>
        <Field
          label={t('admin.periods.exams.classroomCount')}
          error={errors.classroomCount ? t('login.errors.required') : null}
        >
          <input
            type="number"
            min={1}
            className="w-full rounded border border-slate-300 px-3 py-2"
            {...register('classroomCount', { valueAsNumber: true })}
          />
        </Field>
        <DialogButtons isBusy={createState.isLoading} onCancel={props.onCancel} />
      </form>
    </DialogShell>
  );
}

function DeleteExamDialog(props: {
  periodId: string;
  examId: string;
  onClose: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const [deleteExam, state] = useDeleteExamMutation();
  return (
    <ConfirmDialog
      title={t('admin.periods.exams.deleteConfirm.title')}
      description={t('admin.periods.exams.deleteConfirm.description')}
      confirmLabel={t('common.delete')}
      isBusy={state.isLoading}
      onConfirm={async () => {
        await deleteExam({ periodId: props.periodId, id: props.examId }).unwrap();
        props.onClose();
      }}
      onCancel={props.onClose}
    />
  );
}

function DialogShell(props: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.currentTarget === e.target) props.onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold">{props.title}</h2>
        {props.children}
      </div>
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

function DialogButtons(props: { isBusy: boolean; onCancel: () => void }): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={props.onCancel}
        className="rounded border border-slate-300 px-3 py-1.5"
      >
        {t('common.cancel')}
      </button>
      <button
        type="submit"
        disabled={props.isBusy}
        className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
      >
        {t('common.save')}
      </button>
    </div>
  );
}
