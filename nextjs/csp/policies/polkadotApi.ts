import type CspDev from 'csp-dev';

import config from 'configs/app';

/**
 * CSP additions for browser-side @polkadot/api use on the Developer Console
 * (Sprint 5 / Phase 4). The library connects to the chain's substrate RPC
 * over WebSocket and instantiates a small WebAssembly module for crypto
 * primitives. Both need explicit CSP allowances that the base `app` policy
 * doesn't grant.
 *
 * - `connect-src wss://...` — chain RPC URLs configured as `https://` need
 *   a matching `wss://` allowance because WebSocket connections match by
 *   scheme + host, not host alone. We derive the `wss://` form from the
 *   existing `config.chain.rpcUrls`.
 *
 * - `script-src 'wasm-unsafe-eval'` — `@polkadot/wasm-crypto` compiles a
 *   WebAssembly module on init. CSP3 introduced the scoped `wasm-unsafe-eval`
 *   keyword (Chrome 91+, Firefox 102+) which permits WASM compilation
 *   without re-enabling general `eval()`. Falls back gracefully to JS
 *   crypto if WASM is blocked, but at ~10× the cost — better to allow it.
 */
export function polkadotApi(): CspDev.DirectiveDescriptor {
  const wsRpcUrls = (config.chain.rpcUrls ?? [])
    .map((url) => {
      try {
        const u = new URL(url);
        u.protocol = u.protocol === 'http:' ? 'ws:' : 'wss:';
        return u.toString().replace(/\/$/, '');
      } catch {
        return null;
      }
    })
    .filter((s): s is string => Boolean(s));

  return {
    'connect-src': [
      ...wsRpcUrls,
    ],
    'script-src': [
      // WebAssembly compilation for @polkadot/wasm-crypto. Scoped equivalent
      // of 'unsafe-eval' that only authorizes WebAssembly, not arbitrary eval.
      '\'wasm-unsafe-eval\'',
    ],
  };
}
