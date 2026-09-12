// @vitest-environment jsdom
// SPDX-License-Identifier: LicenseRef-Blockscout

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/config', () => ({ 'default': {
  chain: { id: '52370', name: 'ROKO' },
  apis: { core: { endpoint: 'https://explorer.example', basePath: '' } },
} }));

import { ethCall, ethSendTx, getProvider, publicRpc, PWROKO, waitForReceipt } from './rpc';

afterEach(() => vi.unstubAllGlobals());

function rpcResponse(result: unknown) {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async() => ({ result }) });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('pwROKO RPC and signing', () => {
  it('reads token supply without an injected wallet', async() => {
    expect(getProvider()).toBeUndefined();
    const supply = `0x${ '1'.padStart(64, '0') }`;
    const fetch = rpcResponse(supply);
    expect(await ethCall('0x18160ddd')).toBe(supply);
    expect(fetch.mock.calls[0][0]).toBe('https://explorer.example/api/eth-rpc');
    expect((JSON.parse(fetch.mock.calls[0][1].body) as { params: Array<{ to: string }> }).params[0].to).toBe(PWROKO);
  });

  it('rejects empty contract results instead of displaying zero', async() => {
    rpcResponse('0x');
    await expect(ethCall('0x18160ddd')).rejects.toThrow('invalid balance');
  });

  it('surfaces RPC errors', async() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async() => ({ error: { message: 'RPC unavailable' } }) }));
    await expect(publicRpc('eth_chainId')).rejects.toThrow('RPC unavailable');
  });

  it('checks the actual wallet network immediately before signing', async() => {
    const request = vi.fn().mockResolvedValue('0x1');
    vi.stubGlobal('window', { ethereum: { request } });
    await expect(ethSendTx('0x123', '0xf83d08ba')).rejects.toThrow('Switch your wallet');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('locks without transferring native value to the precompile', async() => {
    const request = vi.fn().mockResolvedValueOnce('0xcc92').mockResolvedValueOnce('0xabc');
    vi.stubGlobal('window', { ethereum: { request } });
    expect(await ethSendTx('0x123', '0xf83d08ba')).toBe('0xabc');
    expect(request.mock.calls[1][0].params[0]).toEqual({ from: '0x123', to: PWROKO, data: '0xf83d08ba', gas: '0xf4240' });
  });

  it('reports reverted receipts', async() => {
    rpcResponse({ status: '0x0' });
    await expect(waitForReceipt('0xabc')).rejects.toThrow('reverted');
  });

  it('accepts successful receipts', async() => {
    rpcResponse({ status: '0x1' });
    await expect(waitForReceipt('0xabc')).resolves.toBeUndefined();
  });
});
