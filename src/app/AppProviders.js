import { AuthProvider } from '../context/AuthContext';
import { FiltersProvider } from '../context/FiltersContext';
import { ToastProvider } from '../context/ToastContext';
import { ViewAsProvider } from '../context/ViewAsContext';

export function AppProviders({ children, initialFilters }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <FiltersProvider initial={initialFilters}>
          <ViewAsProvider>{children}</ViewAsProvider>
        </FiltersProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
