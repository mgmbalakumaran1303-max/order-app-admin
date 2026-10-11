import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { findPageHeading, renderApp, resetAll } from '../test-utils/renderApp';
import { getDb, mockControls } from '../mocks/db';

beforeEach(resetAll);

describe('Reveal personal data', () => {
  test('requires a reason, then reveals the value and records an audit entry', async () => {
    const auditBefore = getDb().auditLog.length;
    renderApp('/order-trace?q=ORD-50001');
    await screen.findByRole('heading', { level: 2, name: /ORD-50001/ });
    const phone = getDb().orders.find((o) => o.id === 'ORD-50001').customer.phone;
    expect(screen.queryByText(phone)).not.toBeInTheDocument();

    userEvent.click(screen.getAllByRole('button', { name: /Reveal/ })[1]);
    const dialog = await screen.findByRole('dialog', { name: 'Reveal personal data' });
    userEvent.click(within(dialog).getByRole('button', { name: /Reveal for/ }));
    expect(await within(dialog).findByText(/Enter a reason of at least 10 characters/)).toBeInTheDocument();
    expect(getDb().auditLog.length).toBe(auditBefore);

    userEvent.type(within(dialog).getByLabelText(/Reason for access/), 'SUP-1234 customer callback');
    userEvent.click(within(dialog).getByRole('button', { name: /Reveal for/ }));
    expect(await screen.findByText(phone)).toBeInTheDocument();
    expect(screen.getByText(/visible until/)).toBeInTheDocument();
    expect(getDb().auditLog[0]).toMatchObject({ action: 'pii.reveal', reason: 'SUP-1234 customer callback' });
  });

  test('cancel closes the dialog without revealing', async () => {
    renderApp('/order-trace?q=ORD-50001');
    await screen.findByRole('heading', { level: 2, name: /ORD-50001/ });
    userEvent.click(screen.getAllByRole('button', { name: /Reveal/ })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Reveal personal data' });
    userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Anna Schmidt')).not.toBeInTheDocument();
  });
});

describe('View as restaurant', () => {
  test('starting a session shows the red banner; ending it removes the banner', async () => {
    renderApp('/restaurants/R-1005');
    await screen.findByRole('heading', { level: 1, name: /Pizza Palace/ });
    expect(screen.queryByTestId('view-as-banner')).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'View as restaurant' }));
    const dialog = await screen.findByRole('dialog', { name: 'View as restaurant' });
    await waitFor(() => expect(within(dialog).getByLabelText(/^Restaurant/)).toHaveValue('R-1005'));
    userEvent.click(within(dialog).getByRole('button', { name: 'Start session' }));
    expect(await within(dialog).findByText('Enter a reason or support ticket reference.')).toBeInTheDocument();

    userEvent.type(within(dialog).getByLabelText(/Reason or support ticket/), 'SUP-5521 menu check');
    userEvent.click(within(dialog).getByRole('button', { name: 'Start session' }));
    const banner = await screen.findByTestId('view-as-banner');
    expect(banner).toHaveTextContent('VIEW AS RESTAURANT ACTIVE');
    expect(banner).toHaveTextContent('Pizza Palace');

    // The banner persists across navigation.
    userEvent.click(screen.getByRole('link', { name: /^Integrations/ }));
    await findPageHeading('Integrations');
    expect(screen.getByTestId('view-as-banner')).toBeInTheDocument();

    userEvent.click(within(screen.getByTestId('view-as-banner')).getByRole('button', { name: /End session/ }));
    await waitFor(() => expect(screen.queryByTestId('view-as-banner')).not.toBeInTheDocument());
    expect(getDb().auditLog.slice(0, 2).map((e) => e.action)).toEqual(['view_as.end', 'view_as.start']);
  });
});

describe('Permissions', () => {
  async function switchToSupportAgent() {
    userEvent.click(screen.getByRole('button', { name: /John Doe/ }));
    userEvent.click(await screen.findByRole('menuitem', { name: /Act as Support Agent/ }));
    await screen.findByText('Mock role switched to Support Agent.');
  }

  test('a role without audit permission sees no protected audit data', async () => {
    renderApp('/security-audit');
    await findPageHeading('Security & Audit');
    expect(await screen.findByRole('table', { name: 'Audit log' })).toBeInTheDocument();
    await switchToSupportAgent();
    expect(await screen.findByRole('heading', { name: "You don't have access" })).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Audit log' })).not.toBeInTheDocument();
    expect(screen.queryByText('10.20.4.17')).not.toBeInTheDocument();
  });

  test('the mock backend rejects forbidden writes even if the UI is bypassed', async () => {
    renderApp('/command-center');
    await findPageHeading('Command Center');
    await switchToSupportAgent();
    const { platformService } = require('../services');
    await expect(platformService.setFeatureFlag('zone-heatmaps', true)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('Error states', () => {
  test('a failed request shows an error with retry', async () => {
    renderApp('/command-center');
    await findPageHeading('Command Center');
    mockControls.simulateErrors = true;
    userEvent.click(screen.getByRole('link', { name: /^Integrations/ }));
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
    mockControls.simulateErrors = false;
    userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Wolt' })).toBeInTheDocument();
  });
});
