import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentPath, renderApp, resetAll } from '../test-utils/renderApp';
import { getDb } from '../mocks/db';

beforeEach(resetAll);

const TABS = [
  ['Overview', '', 'Health checks'],
  ['Orders', '/orders', /orders$/],
  ['Channels', '/channels', 'Wolt'],
  ['Menu', '/menu', 'Menu synchronization'],
  ['Delivery Zones', '/delivery-zones', 'Zone A – Core'],
  ['Devices', '/devices', 'Bella Italia Order tablet'],
  ['AI', '/ai', 'AI ordering not enabled'],
  ['Configuration', '/configuration', 'Operational settings'],
  ['Audit', '/audit', /No audit entries|Timestamp/],
];

test('all nine tabs are reachable and keep the selected restaurant', async () => {
  renderApp('/restaurants/R-1001');
  await screen.findByRole('heading', { level: 1, name: /Bella Italia/ });
  const tabs = screen.getByRole('navigation', { name: 'Restaurant sections' });
  expect(within(tabs).getAllByRole('link')).toHaveLength(9);

  for (const [label, suffix, marker] of TABS) {
    userEvent.click(within(tabs).getByRole('link', { name: label }));
    await waitFor(() => expect(currentPath()).toBe(`/restaurants/R-1001${suffix}`));
    expect(within(tabs).getByRole('link', { name: label })).toHaveClass('is-active');
    expect((await screen.findAllByText(marker)).length).toBeGreaterThan(0);
    // Shared header still shows the same restaurant.
    expect(screen.getByRole('heading', { level: 1, name: /Bella Italia/ })).toBeInTheDocument();
  }
});

test('restaurant-specific data is shown', async () => {
  renderApp('/restaurants/R-1007/menu');
  await screen.findByRole('heading', { level: 1, name: /Curry Corner/ });
  expect(await screen.findByText(/references a deleted modifier group/)).toBeInTheDocument();
});

test('an offline restaurant shows the old-data banner and no-data charts', async () => {
  renderApp('/restaurants/R-1004');
  await screen.findByRole('heading', { level: 1, name: /Taco Loco/ });
  expect(screen.getByText('Old data.')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
});

test('configuration changes are confirmed with the affected restaurant before saving', async () => {
  renderApp('/restaurants/R-1003/configuration');
  const field = await screen.findByLabelText('Default preparation time (min)');
  userEvent.clear(field);
  userEvent.type(field, '25');
  userEvent.click(screen.getByRole('button', { name: 'Review & save' }));
  const dialog = await screen.findByRole('dialog', { name: 'Save configuration changes' });
  expect(within(dialog).getByTestId('confirm-resource')).toHaveTextContent('Burger House (R-1003)');
  expect(within(dialog).getByText('Default preparation time (min): 25')).toBeInTheDocument();
  userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText('Configuration saved.')).toBeInTheDocument();
  expect(getDb().restaurants.find((r) => r.id === 'R-1003').config.prepTimeMinutes).toBe(25);
});

test('invalid configuration values are rejected before confirmation', async () => {
  renderApp('/restaurants/R-1003/configuration');
  const field = await screen.findByLabelText('Default preparation time (min)');
  userEvent.clear(field);
  userEvent.type(field, '500');
  userEvent.click(screen.getByRole('button', { name: 'Review & save' }));
  expect(await screen.findByText('Enter a value between 5 and 90.')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('an unknown restaurant shows a not-found state', async () => {
  renderApp('/restaurants/R-0000');
  expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
});
