// SPDX-License-Identifier: LicenseRef-Blockscout

/* eslint-disable react/jsx-no-bind */
import { Box, Code, Flex, Grid, Input, Text, chakra } from '@chakra-ui/react';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import DeveloperSubNav from 'src/features/developer/components/DeveloperSubNav';
import { usePolkadotApi } from 'src/features/substrate/hooks/usePolkadotApi';

import { Button } from 'src/toolkit/chakra/button';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

import { parameterHelp, parseRpcParams, TEMPORAL_GUIDES } from './rpc-guidance';
import type { RpcGuide } from './rpc-guidance';
import RpcMethodPicker from './RpcMethodPicker';

const DeveloperRpc = () => {
  const apiQuery = usePolkadotApi();
  const [ method, setMethod ] = React.useState('system_health');
  const [ methods, setMethods ] = React.useState<Array<string>>([]);
  const [ discoveryError, setDiscoveryError ] = React.useState('');
  const [ values, setValues ] = React.useState<Array<string>>([]);
  const [ advanced, setAdvanced ] = React.useState(false);
  const [ raw, setRaw ] = React.useState('[]');
  const [ result, setResult ] = React.useState<string | null>(null);
  const [ error, setError ] = React.useState('');
  const [ busy, setBusy ] = React.useState(false);
  const [ validators, setValidators ] = React.useState<Array<string>>([]);
  const generation = React.useRef(0);
  const selectedMethod = React.useRef(method);
  const bundle = apiQuery.data;

  React.useEffect(() => {
    let active = true;
    if (bundle) {
      bundle
        .sendRpc('rpc_methods', [])
        .then((data) => {
          const list = (data as { methods?: unknown }).methods;
          if (!Array.isArray(list) || !list.every((item) => typeof item === 'string')) throw new Error('Invalid method list');
          if (active) {
            setMethods(list.sort());
            setDiscoveryError('');
          }
        })
        .catch(() => {
          if (active)
            setDiscoveryError(
              'Method discovery is unavailable. Known method documentation is still available; the server may not support every entry.',
            );
        });
    }
    return () => {
      active = false;
      generation.current += 1;
    };
  }, [ bundle ]);

  const guides = React.useMemo(() => {
    const out: Record<string, RpcGuide> = { ...TEMPORAL_GUIDES };
    for (const [ namespace, section ] of Object.entries(bundle?.api.rpc ?? {})) {
      for (const [ name, fn ] of Object.entries(section ?? {})) {
        const meta = (fn as { meta?: RpcGuide & { jsonrpc?: string; isSubscription?: boolean } }).meta;
        if (meta?.params && !meta.isSubscription) out[meta.jsonrpc ?? `${ namespace }_${ name }`] = meta;
      }
    }
    return out;
  }, [ bundle ]);
  const guide = Object.prototype.hasOwnProperty.call(guides, method) ? guides[method] : undefined;
  const useRaw = advanced || !guide;
  const unsupported = methods.length > 0 && !methods.includes(method);
  const subscription = /subscribe|unsubscribe/i.test(method);
  const { params, validation } = React.useMemo(() => {
    try {
      return {
        params: bundle ? parseRpcParams(bundle.api.registry, guide, values, useRaw ? raw : undefined) : [],
        validation: '',
      };
    } catch (err) {
      return { params: [], validation: err instanceof Error ? err.message : 'Check the parameters.' };
    }
  }, [ bundle, guide, values, useRaw, raw ]);

  const clearRequest = React.useCallback(() => {
    generation.current += 1;
    setResult(null);
    setError('');
    setBusy(false);
  }, []);
  const selectMethod = React.useCallback((next: string) => {
    const normalized = next.replace('.', '_');
    if (normalized === selectedMethod.current) return;
    selectedMethod.current = normalized;
    clearRequest();
    setMethod(normalized);
    setValues([]);
    setRaw('[]');
    setAdvanced(false);
    setValidators([]);
  }, [ clearRequest ]);
  async function findValidators() {
    if (!bundle) return;
    const request = ++generation.current;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const accounts = await bundle.api.query.session.validators();
      if (request === generation.current)
        setValidators(accounts.map((account: { toString: () => string }) => account.toString()));
    } catch (err) {
      if (request === generation.current) setError(err instanceof Error ? err.message : 'Validator lookup failed.');
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }
  async function submit() {
    if (!bundle || !method || validation || unsupported || subscription || busy) return;
    const request = ++generation.current;
    setBusy(true);
    setResult(null);
    setError('');
    try {
      const response = await bundle.sendRpc(method, params);
      if (request === generation.current) setResult(JSON.stringify(response ?? null, null, 2));
    } catch (err) {
      if (request === generation.current) setError(err instanceof Error ? err.message : 'RPC request failed.');
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }
  async function fillFinalized(index: number, number: boolean) {
    if (!bundle) return;
    const request = ++generation.current;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const hash = await bundle.sendRpc('chain_getFinalizedHead', []);
      const header = number ? ((await bundle.sendRpc('chain_getHeader', [ hash ])) as { number: string }) : undefined;
      const value = header ? BigInt(header.number).toString() : String(hash);
      if (request === generation.current)
        setValues((previous) => {
          const next = [ ...previous ];
          next[index] = value;
          return next;
        });
    } catch (err) {
      if (request === generation.current) setError(err instanceof Error ? err.message : 'Finalized block lookup failed.');
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }

  return (
    <>
      <DeveloperSubNav/>
      <PageTitle title="RPC Calls" secondRow="Explore RPC methods, understand their parameters, and inspect a response."/>
      { apiQuery.isLoading && <Skeleton loading h="120px"/> }
      { apiQuery.isError && (
        <Box role="alert" mb={ 4 }>
          Could not connect to the chain. <Button onClick={ () => apiQuery.refetch() }>Retry connection</Button>
        </Box>
      ) }
      { bundle && (
        <Text mb={ 4 } color="text.secondary" fontSize="sm">
          { bundle.chain } · { bundle.nodeName } { bundle.nodeVersion } · { methods.length } advertised methods
        </Text>
      ) }
      { discoveryError && (
        <Text role="status" mb={ 4 }>
          { discoveryError }
        </Text>
      ) }
      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={ 6 }>
        <RpcMethodPicker methods={ methods } guides={ guides } selected={ method } onSelect={ selectMethod }/>
        <Box minW={ 0 }>
          <chakra.label htmlFor="rpc-method">Method</chakra.label>
          <Input id="rpc-method" value={ method } onChange={ (e) => selectMethod(e.target.value) } fontFamily="mono" mb={ 3 }/>
          <Box p={ 4 } borderWidth="1px" borderRadius="md" mb={ 4 }>
            <Text fontWeight="semibold" overflowWrap="anywhere">
              { method || 'Select a method' }
            </Text>
            <Text mt={ 2 }>
              { guide?.description ??
                'Parameter metadata is not available for this method. Consult its RPC documentation before entering raw JSON.' }
            </Text>
            { guide && (
              <Text fontSize="sm" mt={ 2 } overflowWrap="anywhere">
                Returns: { guide.type } · { guide.params.filter((p) => !p.isOptional).length } required parameter(s)
              </Text>
            ) }
            <Text fontSize="xs" mt={ 2 } color="text.secondary">
              { guide &&
                (TEMPORAL_GUIDES[method] ?
                  'ROKO RPC documentation; availability checked against the connected node.' :
                  'Polkadot.js RPC definitions; availability checked against the connected node.') }
            </Text>
          </Box>
          { unsupported && (
            <Text role="alert" mb={ 3 }>
              This node does not advertise this method. Select an available method from the list.
            </Text>
          ) }
          { subscription && (
            <Text role="status" mb={ 3 }>
              Subscriptions require a streaming client. This tab supports single-response requests.
            </Text>
          ) }
          { guide && (
            <Button
              variant="outline"
              size="sm"
              mb={ 4 }
              onClick={ () => {
                clearRequest();
                if (!advanced) setRaw(JSON.stringify(params));
                else {
                  try {
                    setValues(
                      parseRpcParams(bundle?.api.registry, guide, [], raw).map((value) =>
                        value === null ? '' : String(typeof value === 'object' ? JSON.stringify(value) : value),
                      ),
                    );
                  } catch {
                    setError('Correct the JSON parameters before switching to guided inputs.');
                    return;
                  }
                }
                setAdvanced(!advanced);
              } }
            >
              { advanced ? 'Use guided inputs' : 'Edit JSON parameters' }
            </Button>
          ) }
          { useRaw ? (
            <Box mb={ 4 }>
              <chakra.label htmlFor="rpc-params">Parameters (JSON array)</chakra.label>
              <Input
                id="rpc-params"
                value={ raw }
                onChange={ (e) => {
                  clearRequest();
                  setRaw(e.target.value);
                } }
                fontFamily="mono"
              />
            </Box>
          ) : null }
          { !useRaw &&
            guide?.params.map((p, index) => (
              <Box key={ `${ method }-${ p.name }` } mb={ 4 }>
                <chakra.label htmlFor={ `rpc-param-${ index }` }>
                  { p.name } · { p.type } · { p.isOptional ? 'Optional — leave blank to omit' : 'Required' }
                </chakra.label>
                <Input
                  id={ `rpc-param-${ index }` }
                  aria-describedby={ `rpc-help-${ index }` }
                  value={ values[index] ?? '' }
                  onChange={ (e) => {
                    clearRequest();
                    setValues((previous) => {
                      const next = [ ...previous ];
                      next[index] = e.target.value;
                      return next;
                    });
                  } }
                />
                <Text id={ `rpc-help-${ index }` } fontSize="sm" color="text.secondary" mt={ 1 }>
                  { parameterHelp(p) }
                </Text>
                { (/BlockHash/.test(p.type) || p.name === 'block_number' || /BlockNumber/.test(p.type)) && (
                  <Button
                    size="sm"
                    variant="outline"
                    mt={ 2 }
                    disabled={ busy }
                    onClick={ () => fillFinalized(index, !/Hash/.test(p.type)) }
                  >
                    Use finalized block{ /Hash/.test(p.type) ? ' hash' : ' number' }
                  </Button>
                ) }
                { p.name === 'authority_index' && (
                  <Box mt={ 2 }>
                    <Button size="sm" variant="outline" disabled={ busy } onClick={ findValidators }>
                      Find current validators
                    </Button>
                    <Text fontSize="xs" mt={ 2 }>
                      Select an account to fill its index. Refresh this list if the validator set changes.
                    </Text>
                    <Flex gap={ 2 } wrap="wrap" mt={ 2 }>
                      { validators.map((account, authorityIndex) => (
                        <chakra.button
                          key={ account }
                          type="button"
                          p={ 2 }
                          borderWidth="1px"
                          borderRadius="md"
                          fontSize="xs"
                          overflowWrap="anywhere"
                          textAlign="left"
                          onClick={ () => {
                            clearRequest();
                            setValues((previous) => {
                              const next = [ ...previous ];
                              next[index] = String(authorityIndex);
                              return next;
                            });
                          } }
                        >
                          { authorityIndex }: { account }
                        </chakra.button>
                      )) }
                    </Flex>
                    <chakra.a href="/developer/chain-state?pallet=Session&item=Validators" color="blue.500" fontSize="sm">
                      Inspect Session.Validators in Chain State →
                    </chakra.a>
                  </Box>
                ) }
              </Box>
            )) }
          { !useRaw && !guide?.params.length && <Text mb={ 4 }>No parameters required. The request uses [].</Text> }
          { validation && (
            <Text role="status" mb={ 3 } color="text.secondary">
              { validation }
            </Text>
          ) }
          <Flex gap={ 3 } mb={ 4 }>
            <Button
              onClick={ submit }
              loading={ busy }
              disabled={ !bundle || !method || Boolean(validation) || unsupported || subscription || busy }
            >
              Call method
            </Button>
            <Button variant="outline" onClick={ clearRequest }>
              Clear response
            </Button>
          </Flex>
          { error && (
            <Box role="alert" p={ 4 } borderWidth="1px" borderRadius="md" mb={ 4 }>
              <Text color="red.500">{ error }</Text>
              <Text fontSize="sm" mt={ 2 }>
                Check the method and parameter types. Historical state may be pruned; try a recent finalized block or an archive
                endpoint. A denied method may require a local node. This request was not retried automatically.
              </Text>
            </Box>
          ) }
          { result !== null && (
            <Box aria-live="polite">
              <Text fontWeight="semibold" mb={ 2 }>
                Response
              </Text>
              { [ 'null', '[]' ].includes(result) && (
                <Text mb={ 2 }>
                  The call succeeded but returned no data. The value may be unrecorded or outside retained history.
                </Text>
              ) }
              <Code display="block" whiteSpace="pre" p={ 3 } borderRadius="md" fontSize="xs" overflowX="auto">
                { result }
              </Code>
            </Box>
          ) }
        </Box>
      </Grid>
    </>
  );
};
export default DeveloperRpc;
