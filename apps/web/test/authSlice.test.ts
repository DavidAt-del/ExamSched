import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, { sessionStarted, sessionEnded } from '../src/features/auth/authSlice';

describe('authSlice', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts with no session', () => {
    const state = authReducer(undefined, { type: 'init' });
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('sessionStarted persists token in sessionStorage', () => {
    const state = authReducer(
      undefined,
      sessionStarted({
        token: 'tok',
        user: {
          id: 'id',
          nationalId: '000000018',
          firstName: 'A',
          lastName: 'B',
          email: null,
          role: 'proctor',
          proctorType: 'opener',
          mustChangePassword: false,
        },
      }),
    );
    expect(state.token).toBe('tok');
    expect(sessionStorage.getItem('proctor.session.token')).toBe('tok');
  });

  it('sessionEnded clears state and sessionStorage', () => {
    sessionStorage.setItem('proctor.session.token', 'tok');
    const state = authReducer(
      { token: 'tok', user: null },
      sessionEnded(),
    );
    expect(state.token).toBeNull();
    expect(sessionStorage.getItem('proctor.session.token')).toBeNull();
  });
});
