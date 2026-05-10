import type {
  AvailabilityDto,
  ListExamsResponse,
  SubmitAvailabilityRequest,
} from '@app/shared';
import { api } from '../../app/api';

export const availabilityApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMyExams: build.query<ListExamsResponse, void>({
      query: () => '/exams/mine',
      providesTags: ['Exam', 'Availability'],
    }),
    submitAvailability: build.mutation<AvailabilityDto, SubmitAvailabilityRequest>({
      query: (body) => ({ url: '/availability', method: 'POST', body }),
      invalidatesTags: ['Availability'],
    }),
  }),
  overrideExisting: false,
});

export const { useListMyExamsQuery, useSubmitAvailabilityMutation } = availabilityApi;
