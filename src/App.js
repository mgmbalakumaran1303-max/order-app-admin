import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/AppProviders';
import { AppRoutes } from './app/AppRoutes';

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
