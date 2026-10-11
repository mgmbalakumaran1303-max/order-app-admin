# Orderflow Control Center (admin web app)

Operations admin for monitoring restaurants, triaging issues, tracing orders, diagnosing delivery zones and watching integrations, devices, AI ordering and the platform.

Built on the existing Create React App setup (React 19, JavaScript) with React Router 7 and Lucide icons. Charts are small in-house SVG components, so there is no chart dependency.

## Running

```bash
npm install
npm start          # http://localhost:3000
npm test           # Jest + Testing Library
npm run build
```

## Deploying to GitHub Pages

Every push to `main` runs `.github/workflows/deploy.yml`, which installs dependencies, runs the tests, builds the app and publishes it with GitHub Pages. You can also start it manually from the Actions tab. One-time setup: in the repository go to **Settings → Pages → Source** and choose **GitHub Actions**.

The site is served from https://mgmbalakumaran1303-max.github.io/order-app-admin (`homepage` in `package.json`). The router uses `PUBLIC_URL` as its basename. `public/404.html` and a small script in `public/index.html` let deep links such as `/order-app-admin/issues/ISS-1001` load correctly on GitHub Pages.

## Data mode

`REACT_APP_DATA_MODE` in `.env` picks where data comes from:

| Value  | Behaviour |
| ------ | --------- |
| `mock` (default) | Services use the in-memory sample data in `src/mocks`. A **Mock data** badge in the top bar, a **Sample data** chip on each page and notes on telemetry/audit views mark it as non-production. Changes last until the page reloads. |
| `api`  | Services go through `src/services/apiClient.js`. No backend contract exists yet, so every method fails with a clear "not connected" error. The app never falls back to mock data. |

In mock mode the profile menu adds developer tools: **Act as Support Agent** (to see permission-denied states) and **Simulate API errors** (to see error states).

Other variables: `REACT_APP_ENVIRONMENT` (environment badge, default `Production`), `REACT_APP_API_BASE_URL`, `REACT_APP_MOCK_LATENCY_MS` (default 350; 0 under test).

## Structure

```
src/
  app/            routes, providers, navigation config
  components/
    layout/       AppLayout, Sidebar, TopBar (breadcrumbs, search, time range, notifications, profile),
                  GlobalFilterBar, PageHeader, SystemStatusFooter, ViewAsBanner, route guards
    ui/           Button, Badge, MetricCard, Panel, DataTable, Pagination, Tabs, DropdownMenu, form controls, tooltip
    charts/       BarChart, LineChart, DonutChart
    feedback/     Loading / Empty / No data / Old data / Error / No permission states
    dialogs/      Modal, ConfirmActionDialog, RevealPersonalDataDialog, ViewAsRestaurantDialog, CreateIncidentDialog
  context/        auth, global filters, toasts, view-as session, breadcrumbs
  features/       one folder per page (restaurants/tabs holds the 9 Restaurant 360 tabs)
  services/       apiClient + service contracts (index.js picks mock or API)
  mocks/          seed data, in-memory db, mock service implementations
  hooks/ utils/ styles/
```

## Connecting the backend

Each service's method names are listed in `CONTRACTS` in `src/services/index.js`. When an endpoint is documented, replace that service's pending stub with an implementation that calls `apiRequest()`. The mock implementation shows the shape the UI expects. Authentication should register its token with `setAuthTokenProvider()`. Permission checks in the UI only shape the interface; the backend must enforce them.

## Out of scope for version 1

As the requirements specify, there are no bulk restaurant actions, no remote device screen control and no raw database or SQL access.
