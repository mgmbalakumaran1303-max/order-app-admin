import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentPath, findPageHeading, renderApp, resetAll } from '../test-utils/renderApp';
import { getDb } from '../mocks/db';

beforeEach(resetAll);

const issueRows = () => screen.getAllByRole('row').filter((r) => /^ISS-\d+:/.test(r.getAttribute('aria-label') || ''));

async function openInbox() {
  renderApp('/issues');
  await findPageHeading('Issue Inbox');
  await screen.findByRole('row', { name: /ISS-1001/ });
}

describe('Issue Inbox search and filters', () => {
  test('search is case-insensitive and matches restaurant names', async () => {
    await openInbox();
    userEvent.type(screen.getByLabelText('Search issues'), 'tAcO lOcO');
    await waitFor(() => expect(issueRows()).toHaveLength(1));
    expect(issueRows()[0]).toHaveAccessibleName('ISS-1003: Restaurant offline');
  });

  test('search matches issue IDs and categories', async () => {
    await openInbox();
    userEvent.type(screen.getByLabelText('Search issues'), 'iss-1007');
    await waitFor(() => expect(issueRows()).toHaveLength(1));
    userEvent.clear(screen.getByLabelText('Search issues'));
    userEvent.type(screen.getByLabelText('Search issues'), 'devices');
    await waitFor(() =>
      expect(issueRows().map((r) => r.getAttribute('aria-label'))).toEqual(['ISS-1004: Printer not working', 'ISS-1010: Tablet battery critical'])
    );
  });

  test('multiple filters combine', async () => {
    await openInbox();
    userEvent.selectOptions(screen.getByLabelText('Severity'), 'High');
    await waitFor(() => expect(issueRows()).toHaveLength(3));
    userEvent.selectOptions(screen.getByLabelText('Status'), 'Investigating');
    await waitFor(() => expect(issueRows()).toHaveLength(1));
    expect(issueRows()[0]).toHaveAccessibleName('ISS-1002: High order rejection rate');
  });

  test('empty results show an empty state that can reset filters', async () => {
    await openInbox();
    userEvent.type(screen.getByLabelText('Search issues'), 'no such issue anywhere');
    expect(await screen.findByRole('heading', { name: 'No matching results' })).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(issueRows().length).toBeGreaterThan(5));
    expect(screen.getByLabelText('Search issues')).toHaveValue('');
  });
});

describe('Create incident dialog', () => {
  const openDialog = async () => {
    await openInbox();
    userEvent.click(screen.getByRole('button', { name: 'Create Incident' }));
    return screen.findByRole('dialog', { name: 'Create incident' });
  };

  test('required fields are validated and nothing is submitted', async () => {
    const before = getDb().incidents.length;
    const dialog = await openDialog();
    userEvent.click(within(dialog).getByRole('button', { name: 'Create Incident' }));
    expect(await within(dialog).findByText('Incident title is required.')).toBeInTheDocument();
    expect(within(dialog).getByText('Severity is required.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Incident title/)).toHaveAttribute('aria-invalid', 'true');
    expect(getDb().incidents.length).toBe(before);
  });

  test('cancel closes without submitting', async () => {
    const before = getDb().incidents.length;
    const dialog = await openDialog();
    userEvent.type(within(dialog).getByLabelText(/Incident title/), 'Draft');
    userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(getDb().incidents.length).toBe(before);
  });

  test('a valid submission creates one incident, shows confirmation and opens it', async () => {
    const before = getDb().incidents.length;
    const dialog = await openDialog();
    userEvent.type(within(dialog).getByLabelText(/Incident title/), 'Lieferando menu outage');
    userEvent.selectOptions(within(dialog).getByLabelText(/Severity/), 'High');
    const submit = within(dialog).getByRole('button', { name: 'Create Incident' });
    // Rapid double submit must not create two incidents.
    userEvent.click(submit);
    expect(submit).toBeDisabled();
    userEvent.click(submit);
    expect(await screen.findByText('Incident INC-302 created.')).toBeInTheDocument();
    expect(getDb().incidents.length).toBe(before + 1);
    expect(await findPageHeading('Lieferando menu outage')).toBeInTheDocument();
    expect(currentPath()).toBe('/incidents/INC-302');
  });
});

describe('Issue Detail actions', () => {
  test('status changes require confirmation and update the issue', async () => {
    renderApp('/issues/ISS-1005');
    await findPageHeading('Delivery zone gap');
    userEvent.click(screen.getByRole('button', { name: 'Change status' }));
    userEvent.click(screen.getByRole('menuitem', { name: 'Mark as Investigating' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change status to Investigating' });
    expect(within(dialog).getByTestId('confirm-resource')).toHaveTextContent('ISS-1005 – Delivery zone gap');
    userEvent.click(within(dialog).getByRole('button', { name: 'Change status' }));
    expect(await screen.findByText('Status changed to Investigating.')).toBeInTheDocument();
    expect(getDb().issues.find((i) => i.id === 'ISS-1005').status).toBe('Investigating');
  });

  test('assign to me updates the assignee', async () => {
    renderApp('/issues/ISS-1003');
    await findPageHeading('Restaurant offline');
    userEvent.click(screen.getByRole('button', { name: 'Assign to me' }));
    expect(await screen.findByText('Issue assigned to you.')).toBeInTheDocument();
    expect(getDb().issues.find((i) => i.id === 'ISS-1003').assigneeId).toBe('u-1');
  });

  test('an unknown issue shows a not-found state', async () => {
    renderApp('/issues/ISS-9999');
    expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  });
});
