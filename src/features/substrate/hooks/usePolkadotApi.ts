/**
 * @polkadot/api connection hook for the Developer Console (Sprint 5 / Phase 4).
 *
 * Lazy-loads @polkadot/api at first use so the ~1–2 MB bundle is only paid
 * on /developer/* routes, not on the existing explorer pages. The connection
 * itself is reused across the developer-console session via React Query.
 *
 * The WS endpoint is derived from `NEXT_PUBLIC_NETWORK_RPC_URL` (HTTP) by
 * swapping the protocol — if the deploy needs a separate WS URL it can
 * be overridden by `NEXT_PUBLIC_NETWORK_RPC_WS_URL`.
 */

import { useQuery } from '@tanstack/react-query';

import config from 'src/config';

function wsEndpoint(): string {
  // Explicit WS env wins.
  const wsEnv = (typeof window !== 'undefined' ?
    (window as unknown as { NEXT_PUBLIC_NETWORK_RPC_WS_URL?: string }).NEXT_PUBLIC_NETWORK_RPC_WS_URL :
    undefined);
  if (wsEnv) return wsEnv;

  // Derive from the HTTP RPC URLs by protocol swap.
  const httpUrl = config.chain.rpcUrls?.[0];
  if (!httpUrl) {
    return 'wss://roko-testnetv2.ntfork.com';
  }
  try {
    const parsed = new URL(httpUrl);
    parsed.protocol = parsed.protocol === 'http:' ? 'ws:' : 'wss:';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return 'wss://roko-testnetv2.ntfork.com';
  }
}

export interface PolkadotApiBundle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any;
  endpoint: string;
  chain: string;
  nodeName: string;
  nodeVersion: string;
}

export function usePolkadotApi() {
  return useQuery<PolkadotApiBundle>({
    queryKey: [ 'polkadot_api_connection' ],
    queryFn: async() => {
      const endpoint = wsEndpoint();
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const provider = new WsProvider(endpoint);
      const api = await ApiPromise.create({ provider });
      const [ chain, nodeName, nodeVersion ] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ]);
      return {
        api,
        endpoint,
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

/**
 * Returns the polkadot.js-Apps deep-link for this chain, pre-connected. Used
 * by the "Submit Extrinsic" card (S5-T21) and by other deferral surfaces.
 */
export function polkadotAppsLink(path = '/extrinsics'): string {
  const ws = wsEndpoint();
  return `https://polkadot.js.org/apps/?rpc=${ encodeURIComponent(ws) }#${ path }`;
}
