import type { SendSchedulesRequest, SendSchedulesResponse } from '@app/shared';
import { api } from '../../app/api';

export const notificationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    sendSchedules: build.mutation<
      SendSchedulesResponse,
      { periodId: string; body: SendSchedulesRequest }
    >({
      query: ({ periodId, body }) => ({
        url: `/admin/periods/${periodId}/send-schedule`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ExamPeriod', 'Assignment'],
    }),
  }),
  overrideExisting: false,
});

export const { useSendSchedulesMutation } = notificationsApi;
