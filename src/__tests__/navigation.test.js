import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentPath, findPageHeading, renderApp, resetAll } from '../test-utils/renderApp';

beforeEach(resetAll);

const SIDEBAR_PAGES = [
  ['Command Center', '/command-center', 'Command Center'],
  ['Issue Inbox', '/issues', 'Issue Inbox'],
  ['Restaurants', '/restaurants', 'Restaurants'],
  ['Order Trace', '/order-trace', 'Order Trace Explorer'],
  ['Delivery Zones', '/delivery-zones', 'Delivery Zone Diagnostics'],
  ['Incident Workspace', '/incidents', 'Incident Workspace'],
  ['Integrations', '/integrations', 'Integrations'],
  ['Device Fleet', '/devices', 'Device Fleet'],
  ['AI Operations', '/ai-operations', 'AI Operations'],
  ['Platform', '/platform', 'Platform'],
  ['Security & Audit', '/security-audit', 'Security & Audit'],
];

test('redirects / to the Command Center', async () => {
  renderApp('/');
  expect(await findPageHeading('Command Center')).toBeInTheDocument();
  expect(currentPath()).toBe('/command-center');
});

test.each(SIDEBAR_PAGES)('sidebar link "%s" opens %s', async (label, path, heading) => {
  renderApp('/command-center');
  await findPageHeading('Command Center');
  const nav = screen.getByRole('complementary', { name: 'Main navigation' });
  const link = within(nav).getByRole('link', { name: new RegExp(`^${label.replace('&', '\\&')}`) });
  userEvent.click(link);
  expect(await findPageHeading(heading)).toBeInTheDocument();
  expect(currentPath()).toBe(path);
  expect(link).toHaveClass('is-active');
});

test('sidebar shows the open-issue badge', async () => {
  renderApp('/command-center');
  expect(await screen.findByLabelText('10 open issues')).toBeInTheDocument();
});

test('Restaurant Directory opens the matching Restaurant 360 record', async () => {
  renderApp('/restaurants');
  userEvent.click(await screen.findByRole('row', { name: 'Open Sushi Central' }));
  expect(await screen.findByRole('heading', { level: 1, name: /Sushi Central/ })).toBeInTheDocument();
  expect(currentPath()).toBe('/restaurants/R-1002');
  expect(screen.getAllByText('R-1002').length).toBeGreaterThan(0);
});

test('Issue Inbox opens the matching Issue Detail record', async () => {
  renderApp('/issues');
  userEvent.click(await screen.findByRole('row', { name: 'ISS-1003: Restaurant offline' }));
  expect(await findPageHeading('Restaurant offline')).toBeInTheDocument();
  expect(currentPath()).toBe('/issues/ISS-1003');
  expect(screen.getByRole('link', { name: 'Taco Loco' })).toBeInTheDocument();
});

test('browser back and forward navigation work', async () => {
  renderApp('/command-center');
  await findPageHeading('Command Center');
  userEvent.click(screen.getByRole('link', { name: /^Integrations/ }));
  await findPageHeading('Integrations');
  userEvent.click(screen.getByRole('button', { name: 'probe-back' }));
  expect(await findPageHeading('Command Center')).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'probe-forward' }));
  expect(await findPageHeading('Integrations')).toBeInTheDocument();
});

test('unknown routes show the Not Found page', async () => {
  renderApp('/does-not-exist');
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
});

test('breadcrumbs reflect the current page and detail record', async () => {
  renderApp('/restaurants/R-1005');
  const crumbs = await screen.findByRole('navigation', { name: 'Breadcrumb' });
  expect(within(crumbs).getByRole('link', { name: 'Restaurants' })).toBeInTheDocument();
  expect(await within(crumbs).findByText('Pizza Palace')).toBeInTheDocument();
});

test('global filters persist across pages and reset restores defaults', async () => {
  renderApp('/command-center');
  await findPageHeading('Command Center');
  userEvent.selectOptions(screen.getByLabelText('Region'), 'east');
  userEvent.click(screen.getByRole('link', { name: /^Restaurants/ }));
  await findPageHeading('Restaurants');
  expect(screen.getByLabelText('Region')).toHaveValue('east');
  // Only Berlin and Leipzig restaurants remain.
  expect(await screen.findByText('4 restaurants')).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: /Reset filters/ }));
  expect(screen.getByLabelText('Region')).toHaveValue('all');
  expect(await screen.findByText('14 restaurants')).toBeInTheDocument();
});
