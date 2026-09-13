// @vitest-environment jsdom
// SPDX-License-Identifier: LicenseRef-Blockscout

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/config', () => ({ 'default': {
  chain: { id: '52370', name: 'ROKO', currency: { symbol: 'ROKO' } },
  apis: { core: { endpoint: 'https://explorer.example' } },
} }));
vi.mock('src/features/pwroko/components/PwRokoIcon', () => ({ 'default': () => null }));

import PwRoko from './PwRoko';

afterEach(() => {
  cleanup(); vi.unstubAllGlobals();
});

describe('pwROKO without MetaMask', () => {
  it('loads public supply and displays a useful wallet connection error', async() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async(_url, init) => ({
      ok: true,
      json: async() => ({
        result: (JSON.parse(init.body) as { method: string }).method === 'eth_chainId' ?
          '0xcc92' : `0x${ (BigInt(10) ** BigInt(18)).toString(16).padStart(64, '0') }`,
      }),
    })));
    render(<ChakraProvider value={ defaultSystem }><PwRoko/></ChakraProvider>);
    await waitFor(() => expect(screen.getByLabelText('Total supply').textContent).toBe('1pwROKO'));
    expect(screen.queryByText(/Failed to load token info/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Connect MetaMask' }));
    await screen.findByText('MetaMask not detected. Please install MetaMask.');
  });

  it('shows an RPC failure instead of inventing a zero supply', async() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    render(<ChakraProvider value={ defaultSystem }><PwRoko/></ChakraProvider>);
    await waitFor(() => expect(screen.getByText(/Failed to load token info: Explorer RPC returned HTTP 503/)).toBeTruthy());
    expect(screen.getByLabelText('Total supply').textContent).toBe('Unavailable');
  });
});
