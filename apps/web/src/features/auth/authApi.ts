import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
} from '@app/shared';
import { api } from '../../app/api';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    changePassword: build.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useChangePasswordMutation } = authApi;
