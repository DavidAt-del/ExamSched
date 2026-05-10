import type {
  AvailabilityDto,
  FinalizeAvailabilityResponse,
  MyPeriodsResponse,
  MyScheduleResponse,
  SubmitAvailabilityRequest,
} from '@app/shared';
import { api } from '../../app/api';

export const proctorApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyPeriods: build.query<MyPeriodsResponse, void>({
      query: () => '/proctor/my-periods',
      providesTags: ['Exam', 'Availability', 'ExamPeriod'],
    }),
    getMySchedule: build.query<MyScheduleResponse, void>({
      query: () => '/proctor/my-schedule',
      providesTags: ['Assignment'],
    }),
    submitAvailability: build.mutation<AvailabilityDto, SubmitAvailabilityRequest>({
      query: (body) => ({ url: '/availability', method: 'POST', body }),
      invalidatesTags: ['Availability'],
    }),
    finalizeAvailability: build.mutation<FinalizeAvailabilityResponse, string>({
      query: (periodId) => ({
        url: `/availability/finalize/${periodId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Availability', 'ExamPeriod'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyPeriodsQuery,
  useGetMyScheduleQuery,
  useSubmitAvailabilityMutation,
  useFinalizeAvailabilityMutation,
} = proctorApi;
