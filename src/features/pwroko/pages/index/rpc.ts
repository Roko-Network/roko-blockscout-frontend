// SPDX-License-Identifier: LicenseRef-Blockscout

import config from 'src/config';

export const PWROKO = '0x0000000000000000000000000000000000000500';
export const EXPECTED_CHAIN_ID_HEX = `0x${ Number(config.chain.id).toString(16) }`;

export type WalletProvider = {
  request(args: { method: string; params?: Array<unknown> }): Promise<unknown>;
  on?(event: string, listener: (...args: Array<never>) => void): void;
  removeListener?(event: string, listener: (...args: Array<never>) => void): void;
};

export function getProvider(): WalletProvider | undefined {
  return typeof window === 'undefined' ? undefined : (window as Window & { ethereum?: WalletProvider }).ethereum;
}

export async function publicRpc<T>(method: string, params: Array<unknown> = []): Promise<T> {
  const core = config.apis.core;
  if (!core) throw new Error('Explorer RPC is not configured.');
  const response = await fetch(`${ core.endpoint }${ core.basePath ?? '' }/api/eth-rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Explorer RPC returned HTTP ${ response.status }`);
  const payload = await response.json() as { result?: T; error?: { message?: string } };
  if (payload.error || payload.result === undefined) throw new Error(payload.error?.message ?? 'Missing RPC result');
  return payload.result as T;
}

export async function ethCall(data: string): Promise<string> {
  const result = await publicRpc<string>('eth_call', [ { to: PWROKO, data }, 'latest' ]);
  if (!/^0x[0-9a-fA-F]{64}$/.test(result)) throw new Error('pwROKO returned an invalid balance');
  return result;
}

export async function ethSendTx(from: string, data: string): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('MetaMask not detected. Please install MetaMask.');
  const chain = await provider.request({ method: 'eth_chainId' });
  if (typeof chain !== 'string' || chain.toLowerCase() !== EXPECTED_CHAIN_ID_HEX) {
    throw new Error(`Switch your wallet to ${ config.chain.name } before submitting.`);
  }
  // The runtime reserves the caller's native balance. Attaching value transfers it away first.
  return provider.request({
    method: 'eth_sendTransaction',
    params: [ { from, to: PWROKO, data, gas: '0xf4240' } ],
  }) as Promise<string>;
}

export async function waitForReceipt(txHash: string, maxAttempts: number = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await publicRpc<{ status: string } | null>('eth_getTransactionReceipt', [ txHash ]);
    if (receipt) {
      if (receipt.status !== '0x1') throw new Error('Transaction reverted.');
      return;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Transaction is still pending. Check its hash in the explorer before retrying.');
}
