import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { findPageHeading, renderApp, resetAll } from '../test-utils/renderApp';
import { deliveryZoneService } from '../services';

beforeEach(resetAll);

test('requires a restaurant and an address before testing', async () => {
  renderApp('/delivery-zones');
  await findPageHeading('Delivery Zone Diagnostics');
  userEvent.click(screen.getByRole('button', { name: 'Test Address' }));
  expect(await screen.findByText('Select a restaurant.')).toBeInTheDocument();
  expect(screen.getByText('Enter a delivery address.')).toBeInTheDocument();
});

test('an unrecognised address is reported as invalid, not as uncovered', async () => {
  renderApp('/delivery-zones?restaurant=R-1001');
  await findPageHeading('Delivery Zone Diagnostics');
  userEvent.type(screen.getByLabelText(/Delivery address/), 'somewhere nice');
  userEvent.click(screen.getByRole('button', { name: 'Test Address' }));
  expect(await screen.findByText(/could not be recognised/)).toBeInTheDocument();
  expect(screen.queryByText('Address is not covered')).not.toBeInTheDocument();
});

test('an address in another city is outside coverage with a reason', async () => {
  renderApp('/delivery-zones?restaurant=R-1001');
  await findPageHeading('Delivery Zone Diagnostics');
  userEvent.type(screen.getByLabelText(/Delivery address/), 'Marienplatz 1, 80331 München');
  userEvent.click(screen.getByRole('button', { name: 'Test Address' }));
  expect(await screen.findByText('Address is not covered')).toBeInTheDocument();
  expect(screen.getByText(/only delivers within Berlin/)).toBeInTheDocument();
});

test('a covered address shows the matching zone, fee and ETA', async () => {
  // Find a Berlin postcode that falls in an active zone for Bella Italia.
  let address;
  for (let n = 10115; n < 10999 && !address; n += 1) {
    // eslint-disable-next-line no-await-in-loop
    const r = await deliveryZoneService.testAddress({ restaurantId: 'R-1001', address: `Teststraße 1, ${n} Berlin` });
    if (r.covered) address = r.address;
  }
  renderApp('/delivery-zones?restaurant=R-1001');
  await findPageHeading('Delivery Zone Diagnostics');
  userEvent.type(screen.getByLabelText(/Delivery address/), address);
  userEvent.click(screen.getByRole('button', { name: 'Test Address' }));
  const result = await screen.findByRole('status', { name: 'Diagnostic result' });
  expect(within(result).getByText('Address is covered')).toBeInTheDocument();
  expect(within(result).getByText(/\(Z-1001-[A-C]\)$/)).toBeInTheDocument();
  expect(within(result).getByText(/^\d+–\d+ min$/)).toBeInTheDocument();
  expect(within(result).getByText(/^\d+,\d{2}\s€$/)).toBeInTheDocument();
});

test('the coverage view is labelled as a schematic, not a map', async () => {
  renderApp('/delivery-zones?restaurant=R-1006');
  expect(await screen.findByText(/not a geographic map/)).toBeInTheDocument();
});
