import type {
  NotificationLogResponse,
  SendSchedulesRequest,
  SendSchedulesResponse,
} from '@app/shared';
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
      invalidatesTags: ['ExamPeriod', 'Assignment', 'NotificationLog'],
    }),
    getNotificationLog: build.query<
      NotificationLogResponse,
      { periodId: string; limit?: number; offset?: number }
    >({
      query: ({ periodId, limit = 50, offset = 0 }) => ({
        url: `/admin/periods/${periodId}/notification-log`,
        params: { limit, offset },
      }),
      providesTags: ['NotificationLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useSendSchedulesMutation, useGetNotificationLogQuery } = notificationsApi;
