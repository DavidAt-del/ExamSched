import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '../src/app/api';
import authReducer from '../src/features/auth/authSlice';
import { LoginPage } from '../src/features/auth/pages/LoginPage';
import '../src/shared/i18n';

function renderApp() {
  const store = configureStore({
    reducer: { auth: authReducer, [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
  setupListeners(store.dispatch);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('LoginPage', () => {
  it('renders Hebrew labels and the submit button', () => {
    renderApp();
    expect(screen.getByText('התחברות')).toBeInTheDocument();
    expect(screen.getByLabelText('תעודת זהות')).toBeInTheDocument();
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'כניסה' })).toBeInTheDocument();
  });
});
