import type {
  ExamAvailabilityResponse,
  ManualOverrideRequest,
  ManualOverrideResponse,
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
      ManualOverrideResponse,
      { examId: string; classroomIndex: number; body: ManualOverrideRequest }
    >({
      query: ({ examId, classroomIndex, body }) => ({
        url: `/admin/exams/${examId}/classrooms/${classroomIndex}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Assignment'],
    }),
    getExamAvailability: build.query<ExamAvailabilityResponse, string>({
      query: (examId) => `/admin/exams/${examId}/availability`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useRunSchedulerMutation,
  useGetScheduleQuery,
  useManualOverrideAssignmentMutation,
  useGetExamAvailabilityQuery,
} = schedulingApi;
