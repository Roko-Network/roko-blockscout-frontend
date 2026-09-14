// SPDX-License-Identifier: LicenseRef-Blockscout
// @vitest-environment jsdom
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

import type { AddressQuery } from 'src/slices/address/hooks/useAddressQuery';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/shared/values/entity/NativeCoinValue', () => ({
  'default': ({ amount }: { amount: string }) => <span data-testid="balance">{ amount }</span>,
}));
vi.mock('src/slices/block/components/entity/BlockEntity', () => ({
  'default': ({ number }: { number: number }) => <a href={ `/block/${ number }` }>Block { number }</a>,
}));

import AddressOverview from './AddressOverview';
import AddressTabGuide from './AddressTabGuide';

afterEach(cleanup);
const mount = (overrides = {}, count?: number, countersError = false) => render(
  <ChakraProvider value={ defaultSystem }>
    <AddressOverview
      query={{ isPlaceholderData: false, data: { coin_balance: '0', block_number_balance_updated_at: 0 }, ...overrides } as AddressQuery}
      transactionCount={ count }
      countersLoading={ false }
      countersError={ countersError }
    />
  </ChakraProvider>,
);

describe('address overview confidence states', () => {
  it('keeps a real zero balance and genesis block visible', () => {
    mount({}, 0);
    expect(screen.getByTestId('balance').textContent).toBe('0');
    expect(screen.getByRole('link', { name: 'Block 0' }).getAttribute('href')).toBe('/block/0');
    expect(screen.queryByText('Unavailable')).toBeNull();
  });
  it('does not present cached data as current after an API failure', () => {
    mount({ isError: true }, 8, true);
    expect(screen.getByText('Balance unavailable')).toBeTruthy();
    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.queryByTestId('balance')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('does not convert missing or degraded balances into zero', () => {
    mount({ isDegradedData: true });
    expect(screen.getByText('Balance unavailable')).toBeTruthy();
    expect(screen.getByText('No block available')).toBeTruthy();
    expect(screen.queryByTestId('balance')).toBeNull();
  });
  it('preserves base-unit precision for large amounts', () => {
    const amount = '123456789012345678901234567890';
    mount({ data: { coin_balance: amount } });
    expect(screen.getByTestId('balance').textContent).toBe(amount);
  });
  it('keeps the recent-history limit and validator guide visible', () => {
    render(<ChakraProvider value={ defaultSystem }><AddressTabGuide tabId="pwroko"/></ChakraProvider>);
    expect(screen.getByText(/Up to 100 recent indexed events/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Validator setup and address guide' }).getAttribute('href'))
      .toBe('https://docs.roko.network/pages/prepare-validator.html');
  });
});
