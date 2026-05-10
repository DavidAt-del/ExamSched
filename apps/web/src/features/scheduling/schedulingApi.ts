import type {
  ManualOverrideRequest,
  ScheduleResultDto,
  ScheduleViewResponse,
} from '@app/shared';
import { api } from '../../app/api';

export const schedulingApi = api.injectEndpoints({
  endpoints: (build) => ({
    runScheduler: build.mutation<ScheduleResultDto, string>({
      query: (periodId) => ({
        url: `/admin/periods/${periodId}/schedule`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Assignment', 'ExamPeriod'],
    }),
    getSchedule: build.query<ScheduleViewResponse, string>({
      query: (periodId) => `/admin/periods/${periodId}/schedule`,
      providesTags: ['Assignment'],
    }),
    manualOverrideAssignment: build.mutation<
      void,
      { examId: string; classroomIndex: number; body: ManualOverrideRequest }
    >({
      query: ({ examId, classroomIndex, body }) => ({
        url: `/admin/exams/${examId}/classrooms/${classroomIndex}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Assignment'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useRunSchedulerMutation,
  useGetScheduleQuery,
  useManualOverrideAssignmentMutation,
} = schedulingApi;
