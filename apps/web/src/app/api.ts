import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store-types';

// Single createApi instance for the whole app. Feature endpoints are added
// via injectEndpoints (see features/*/*Api.ts).
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'ExamPeriod', 'Exam', 'Availability', 'Assignment', 'NotificationLog'],
  endpoints: () => ({}),
});
