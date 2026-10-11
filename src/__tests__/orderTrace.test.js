import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentPath, findPageHeading, renderApp, resetAll } from '../test-utils/renderApp';
import { buildTimeline } from '../features/order-trace/OrderTracePage';
import { formatTimestamp } from '../utils/format';
import { getDb } from '../mocks/db';

beforeEach(resetAll);

const stepState = (step) => screen.getByTestId(`step-${step}`).getAttribute('data-state');

test('searching a valid order shows its lifecycle timeline', async () => {
  renderApp('/order-trace');
  await findPageHeading('Order Trace Explorer');
  userEvent.type(screen.getByLabelText('Order ID or provider reference'), 'ord-50001');
  userEvent.click(screen.getByRole('button', { name: 'Trace order' }));
  expect(await screen.findByRole('heading', { level: 2, name: /ORD-50001/ })).toBeInTheDocument();
  expect(currentPath()).toBe('/order-trace?q=ord-50001');
  ['Received', 'Accepted', 'Preparing', 'Ready', 'Picked Up', 'Delivered'].forEach((s) => expect(stepState(s)).toBe('done'));
});

test('orders can be found by provider reference', async () => {
  const ref = getDb().orders.find((o) => o.id === 'ORD-50002').providerRef;
  renderApp(`/order-trace?q=${ref}`);
  expect(await screen.findByRole('heading', { level: 2, name: /ORD-50002/ })).toBeInTheDocument();
});

test('an unknown order shows a not-found state', async () => {
  renderApp('/order-trace?q=ORD-00000');
  expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  expect(screen.getByText('Order "ORD-00000" was not found.')).toBeInTheDocument();
});

test('an empty search shows a validation message', async () => {
  renderApp('/order-trace');
  await findPageHeading('Order Trace Explorer');
  userEvent.click(screen.getByRole('button', { name: 'Trace order' }));
  expect(await screen.findByText('Enter an order ID or provider reference.')).toBeInTheDocument();
});

test('a cancelled order is never shown as delivered', async () => {
  renderApp('/order-trace?q=ORD-50003');
  await screen.findByRole('heading', { level: 2, name: /ORD-50003/ });
  expect(stepState('Received')).toBe('done');
  expect(stepState('Cancelled')).toBe('failed');
  expect(stepState('Delivered')).toBe('skipped');
  expect(stepState('Accepted')).toBe('skipped');
});

test('event log timestamps are chronological and formatted', async () => {
  renderApp('/order-trace?q=ORD-50001');
  await screen.findByRole('heading', { level: 2, name: /ORD-50001/ });
  const order = getDb().orders.find((o) => o.id === 'ORD-50001');
  const table = screen.getByRole('table', { name: 'Order events' });
  const chronological = [...order.events].sort((a, b) => a.at.localeCompare(b.at));
  const rendered = within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent));
  expect(rendered.map((cells) => cells[0])).toEqual(chronological.map((e) => formatTimestamp(e.at)));
  expect(rendered.map((cells) => cells[1])).toEqual(chronological.map((e) => e.type));
});

test('the related restaurant and issue are linked', async () => {
  renderApp('/order-trace?q=ORD-50002');
  await screen.findByRole('heading', { level: 2, name: /ORD-50002/ });
  userEvent.click(screen.getByRole('link', { name: /Related issue ISS-1001/ }));
  expect(await findPageHeading('Orders not coming from Wolt')).toBeInTheDocument();
});

describe('buildTimeline', () => {
  const ev = (type, at) => ({ type, at, description: '', source: '' });
  test('marks the next step as current for an in-progress order', () => {
    const steps = buildTimeline([ev('Received', '2026-01-01T10:00:00Z'), ev('Accepted', '2026-01-01T10:01:00Z')]);
    expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'current', 'pending', 'pending', 'pending']);
  });
  test('inserts the failure and skips the remaining steps', () => {
    const steps = buildTimeline([ev('Received', '2026-01-01T10:00:00Z'), ev('Rejected', '2026-01-01T10:02:00Z')]);
    expect(steps.map((s) => `${s.step}:${s.state}`)).toEqual([
      'Received:done',
      'Rejected:failed',
      'Accepted:skipped',
      'Preparing:skipped',
      'Ready:skipped',
      'Picked Up:skipped',
      'Delivered:skipped',
    ]);
  });
});
