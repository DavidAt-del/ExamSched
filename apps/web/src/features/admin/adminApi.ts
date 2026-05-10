import type {
  CreateExamPeriodRequest,
  CreateExamRequest,
  CreateProctorRequest,
  ExamListResponse,
  ExamPeriodDto,
  ExamPeriodListResponse,
  ImportProctorsResult,
  ProctorListItem,
  ProctorListResponse,
  ResetPasswordResponse,
  UpdateProctorRequest,
} from '@app/shared';
import { api } from '../../app/api';

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ── Proctors ────────────────────────────────────────────────────────
    listProctors: build.query<ProctorListResponse, void>({
      query: () => '/admin/proctors',
      providesTags: ['User'],
    }),
    createProctor: build.mutation<ProctorListItem, CreateProctorRequest>({
      query: (body) => ({ url: '/admin/proctors', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateProctor: build.mutation<void, { id: string; patch: UpdateProctorRequest }>({
      query: ({ id, patch }) => ({
        url: `/admin/proctors/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['User'],
    }),
    deactivateProctor: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/proctors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
    resetProctorPassword: build.mutation<ResetPasswordResponse, string>({
      query: (id) => ({
        url: `/admin/proctors/${id}/reset-password`,
        method: 'POST',
      }),
    }),
    importProctors: build.mutation<ImportProctorsResult, FormData>({
      query: (form) => ({
        url: '/admin/proctors/import',
        method: 'POST',
        body: form,
      }),
      invalidatesTags: ['User'],
    }),

    // ── Exam periods ────────────────────────────────────────────────────
    listPeriods: build.query<ExamPeriodListResponse, void>({
      query: () => '/admin/periods',
      providesTags: ['ExamPeriod'],
    }),
    createPeriod: build.mutation<ExamPeriodDto, CreateExamPeriodRequest>({
      query: (body) => ({ url: '/admin/periods', method: 'POST', body }),
      invalidatesTags: ['ExamPeriod'],
    }),
    closePeriod: build.mutation<void, string>({
      query: (id) => ({
        url: `/admin/periods/${id}/close`,
        method: 'PATCH',
      }),
      invalidatesTags: ['ExamPeriod'],
    }),

    // ── Exams ───────────────────────────────────────────────────────────
    listExamsForPeriod: build.query<ExamListResponse, string>({
      query: (periodId) => `/admin/periods/${periodId}/exams`,
      providesTags: ['Exam'],
    }),
    createExam: build.mutation<unknown, { periodId: string; body: CreateExamRequest }>({
      query: ({ periodId, body }) => ({
        url: `/admin/periods/${periodId}/exams`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Exam'],
    }),
    deleteExam: build.mutation<void, { periodId: string; id: string }>({
      query: ({ periodId, id }) => ({
        url: `/admin/periods/${periodId}/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exam'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProctorsQuery,
  useCreateProctorMutation,
  useUpdateProctorMutation,
  useDeactivateProctorMutation,
  useResetProctorPasswordMutation,
  useImportProctorsMutation,
  useListPeriodsQuery,
  useCreatePeriodMutation,
  useClosePeriodMutation,
  useListExamsForPeriodQuery,
  useCreateExamMutation,
  useDeleteExamMutation,
} = adminApi;
