import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '../src/app/api';
import authReducer from '../src/features/auth/authSlice';
import { ChangePasswordPage } from '../src/features/auth/pages/ChangePasswordPage';
import '../src/shared/i18n';

function renderApp() {
  const store = configureStore({
    reducer: { auth: authReducer, [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
  setupListeners(store.dispatch);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/change-password']}>
        <Routes>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/login" element={<div data-testid="login-stub">login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ChangePasswordPage', () => {
  it('renders the three Hebrew password fields and the submit button', () => {
    renderApp();
    expect(screen.getByText('החלפת סיסמה')).toBeInTheDocument();
    expect(screen.getByLabelText('הסיסמה הנוכחית')).toBeInTheDocument();
    expect(screen.getByLabelText('סיסמה חדשה')).toBeInTheDocument();
    expect(screen.getByLabelText('אימות סיסמה חדשה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שמירה' })).toBeInTheDocument();
  });

  it('shows the mismatch error when confirm differs from new password', async () => {
    renderApp();
    fireEvent.change(screen.getByLabelText('הסיסמה הנוכחית'), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByLabelText('סיסמה חדשה'), {
      target: { value: 'newpass' },
    });
    fireEvent.change(screen.getByLabelText('אימות סיסמה חדשה'), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'שמירה' }));
    await waitFor(() => {
      expect(screen.getByText('אימות הסיסמה אינו תואם.')).toBeInTheDocument();
    });
  });
});
