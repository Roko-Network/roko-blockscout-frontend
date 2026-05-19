/**
 * @polkadot/api connection hook for the Developer Console (Sprint 5 / Phase 4).
 *
 * Lazy-loads @polkadot/api at first use so the ~1–2 MB bundle is only paid
 * on /developer/* routes, not on the existing explorer pages. The connection
 * itself is reused across the developer-console session via React Query.
 *
 * Provider selection: prefer HttpProvider against the chain's HTTPS RPC by
 * default. The deployed testnet only exposes HTTPS POST at `roko-testnetv2
 * .ntfork.com` (no WebSocket upgrade configured in nginx), so a WsProvider
 * would hang forever waiting for a handshake. HttpProvider supports all
 * single-shot queries the dev console needs (chain state reads, constants,
 * RPC calls) — it doesn't support subscriptions but the dev console doesn't
 * use any. Set `NEXT_PUBLIC_NETWORK_RPC_WS_URL` to opt back into WS once a
 * WS endpoint exists.
 *
 * Polkadot.js Apps deep-links still use the WS form (Apps refuses HTTPS) so
 * the link generator below derives a WS URL anyway, with the understanding
 * that Apps will surface the WS-unreachable error to the operator instead.
 */

import { useQuery } from '@tanstack/react-query';

import config from 'configs/app';

interface RuntimeEnv {
  NEXT_PUBLIC_NETWORK_RPC_URL?: string;
  NEXT_PUBLIC_NETWORK_RPC_WS_URL?: string;
  NEXT_PUBLIC_NETWORK_RPC_DIRECT_URL?: string;
}

function runtimeEnv(): RuntimeEnv {
  if (typeof window === 'undefined') return {};
  // Blockscout's runtime-env loader injects all `NEXT_PUBLIC_*` vars onto
  // `window.__envs` at request time (see /assets/envs.js). Reading from
  // `window.*` directly returns undefined.
  const envs = (window as unknown as { __envs?: RuntimeEnv }).__envs;
  return envs ?? {};
}

function httpEndpoint(): string {
  // Default: same-origin proxy. The backend forwards JSON-RPC envelopes
  // verbatim to the upstream substrate node — avoids cross-origin preflight
  // overhead and a class of browser-side fetch hangs that didn't reproduce
  // server-side. Operators can set NEXT_PUBLIC_NETWORK_RPC_DIRECT_URL to
  // bypass the proxy and hit the chain endpoint directly (useful when
  // running against a separate chain than what the backend talks to).
  const env = runtimeEnv();
  if (env.NEXT_PUBLIC_NETWORK_RPC_DIRECT_URL) return env.NEXT_PUBLIC_NETWORK_RPC_DIRECT_URL;
  if (typeof window !== 'undefined') {
    return `${ window.location.origin }/api/v2/substrate/rpc`;
  }
  return env.NEXT_PUBLIC_NETWORK_RPC_URL ?? config.chain.rpcUrls?.[0] ?? 'https://roko-testnetv2.ntfork.com';
}

function wsEndpoint(): string {
  const env = runtimeEnv();
  if (env.NEXT_PUBLIC_NETWORK_RPC_WS_URL) return env.NEXT_PUBLIC_NETWORK_RPC_WS_URL;
  try {
    const parsed = new URL(httpEndpoint());
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
  transport: 'http' | 'ws';
  chain: string;
  nodeName: string;
  nodeVersion: string;
}

export function usePolkadotApi() {
  return useQuery<PolkadotApiBundle>({
    queryKey: [ 'polkadot_api_connection' ],
    queryFn: async() => {
      const env = runtimeEnv();
      // Explicit WS env opts back into the WS path once a WS endpoint exists.
      const useWs = Boolean(env.NEXT_PUBLIC_NETWORK_RPC_WS_URL);
      const endpoint = useWs ? wsEndpoint() : httpEndpoint();
      // eslint-disable-next-line no-console
      console.log('[dev-console] connecting', { useWs, endpoint });

      // Wrap the whole sequence (dynamic import + ApiPromise.create + initial
      // RPC calls) in one timeout. A long-tail hang in any of these stages
      // would otherwise leave the page on Skeleton with no error surface.
      const work = (async() => {
        // eslint-disable-next-line no-console
        console.log('[dev-console] loading @polkadot/api chunk');
        const polkadotApi = await import('@polkadot/api');
        // eslint-disable-next-line no-console
        console.log('[dev-console] chunk loaded, instantiating provider');
        const provider = useWs ?
          new polkadotApi.WsProvider(endpoint) :
          new polkadotApi.HttpProvider(endpoint);
        // eslint-disable-next-line no-console
        console.log('[dev-console] ApiPromise.create...');
        const api = await polkadotApi.ApiPromise.create({ provider, noInitWarn: true });
        // eslint-disable-next-line no-console
        console.log('[dev-console] api ready, fetching chain identity');
        const [ chain, nodeName, nodeVersion ] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.name(),
          api.rpc.system.version(),
        ]);
        return {
          api,
          endpoint,
          transport: (useWs ? 'ws' : 'http') as 'http' | 'ws',
          chain: chain.toString(),
          nodeName: nodeName.toString(),
          nodeVersion: nodeVersion.toString(),
        };
      })();

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Dev console init timed out after 15s against ${ endpoint } (useWs=${ useWs })`)), 15_000),
      );

      try {
        return await Promise.race([ work, timeout ]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[dev-console] init failed:', err);
        throw err;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

/**
 * Returns the polkadot.js-Apps deep-link for this chain. Apps requires a WS
 * endpoint and refuses HTTPS RPC URLs — this returns one regardless of the
 * dev-console transport. If the underlying chain has no WS exposed, Apps
 * will display its own connection error.
 */
export function polkadotAppsLink(path = '/extrinsics'): string {
  const ws = wsEndpoint();
  return `https://polkadot.js.org/apps/?rpc=${ encodeURIComponent(ws) }#${ path }`;
}
