import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { AppProviders } from '../app/AppProviders';
import { AppRoutes } from '../app/AppRoutes';
import { DEFAULT_FILTERS } from '../context/FiltersContext';
import { resetMockDb } from '../mocks/db';
import { resetMockSession } from '../mocks/services/authService';

/** Test-only helper that exposes the current location and history controls. */
function NavProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <span data-testid="location">{location.pathname + location.search}</span>
      <button type="button" onClick={() => navigate(-1)}>
        probe-back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        probe-forward
      </button>
    </div>
  );
}

export function renderApp(path = '/command-center') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders initialFilters={DEFAULT_FILTERS}>
        <AppRoutes />
        <NavProbe />
      </AppProviders>
    </MemoryRouter>
  );
}

export function resetAll() {
  resetMockDb();
  resetMockSession();
  sessionStorage.clear();
  localStorage.clear();
}

export const currentPath = () => screen.getByTestId('location').textContent;

/** Page <h1> names include a "Sample data" chip in mock mode, so match the start. */
export const findPageHeading = (title) =>
  screen.findByRole('heading', { level: 1, name: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&')}`) });
