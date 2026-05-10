import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthenticatedUser } from '@app/shared';

const TOKEN_KEY = 'proctor.session.token';
const USER_KEY = 'proctor.session.user';

function readSession(): { token: string | null; user: AuthenticatedUser | null } {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const userRaw = sessionStorage.getItem(USER_KEY);
    return {
      token,
      user: userRaw ? (JSON.parse(userRaw) as AuthenticatedUser) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

export interface AuthState {
  token: string | null;
  user: AuthenticatedUser | null;
}

const initialState: AuthState = readSession();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(
      state,
      action: PayloadAction<{ token: string; user: AuthenticatedUser }>,
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      sessionStorage.setItem(TOKEN_KEY, action.payload.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
    },
    sessionEnded(state) {
      state.token = null;
      state.user = null;
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    },
  },
});

export const { sessionStarted, sessionEnded } = authSlice.actions;
export default authSlice.reducer;
