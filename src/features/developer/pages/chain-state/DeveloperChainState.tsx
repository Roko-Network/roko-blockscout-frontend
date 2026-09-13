// SPDX-License-Identifier: LicenseRef-Blockscout

// Developer-console page — read-only metadata-driven UI. The `react/jsx-no-bind`
// rule guards against re-renders from inline handlers; on dev-tool pages
// (rendered rarely, no virtualized lists) the perf cost is negligible and the
// extra useCallback ceremony hurts readability.
/* eslint-disable react/jsx-no-bind */
import { Box, Code, Flex, Grid, Input, Text, chakra } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import DeveloperSubNav from 'src/features/developer/components/DeveloperSubNav';
import { usePolkadotApi } from 'src/features/substrate/hooks/usePolkadotApi';

import { collator } from 'src/shared/texts/collator';

import { Button } from 'src/toolkit/chakra/button';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

import { describeKey, parseLookupKeys } from './storage-lookup';

interface StorageItemInfo {
  name: string;
  modifier: string;
  type: string;
  keyTypes: Array<string>;
  canBrowse: boolean;
  docs: string;
}

interface PalletInfo {
  name: string;
  storage: Array<StorageItemInfo>;
}

const DeveloperChainState = () => {
  const router = useRouter();
  const apiQuery = usePolkadotApi();

  const [ pallet, setPallet ] = React.useState<string>('');
  const [ item, setItem ] = React.useState<string>('');
  const [ values, setValues ] = React.useState<Array<string>>([]);
  const [ advanced, setAdvanced ] = React.useState(false);
  const [ browsing, setBrowsing ] = React.useState(false);
  const [ choices, setChoices ] = React.useState<Array<{ hex: string; values: Array<string> }>>([]);
  const [ browseCursor, setBrowseCursor ] = React.useState('');
  const [ browseHash, setBrowseHash ] = React.useState('');
  const [ hasMore, setHasMore ] = React.useState(false);
  const [ browseMessage, setBrowseMessage ] = React.useState('');
  const generation = React.useRef(0);
  const restoredUrl = React.useRef('');
  const [ keysJson, setKeysJson ] = React.useState<string>('[]');
  const [ result, setResult ] = React.useState<{ value: string; rawHex?: string } | null>(null);
  const [ error, setError ] = React.useState<string | null>(null);
  const [ isQuerying, setIsQuerying ] = React.useState(false);

  // Build a structured pallet/storage catalogue from runtime metadata.
  // Computed once at first render after the api connects.
  const pallets: Array<PalletInfo> = React.useMemo(() => {
    if (!apiQuery.data?.api) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api: any = apiQuery.data.api;
    const out: Array<PalletInfo> = [];
    const metaPallets = api.runtimeMetadata.asLatest.pallets;
    for (const p of metaPallets) {
      const palletName = p.name.toString();
      const storage = p.storage.unwrapOr(null);
      if (!storage) continue;
      const items: Array<StorageItemInfo> = [];
      for (const si of storage.items) {
        const typeMeta = si.type;
        let keyTypes: Array<string> = [];
        let valueType = '';
        if (typeMeta.isPlain) {
          valueType = api.registry.lookup.getName(typeMeta.asPlain) || api.registry.lookup.getTypeDef(typeMeta.asPlain).type;
        } else if (typeMeta.isMap) {
          const m = typeMeta.asMap;
          const keyIds = m.hashers.length > 1 ? Array.from(api.registry.lookup.getSiType(m.key).def.asTuple) : [ m.key ];
          keyTypes = keyIds.map((id) => api.registry.lookup.getTypeDef(id).type);
          valueType = api.registry.lookup.getName(m.value) || api.registry.lookup.getTypeDef(m.value).type;
        }
        items.push({
          name: si.name.toString(),
          modifier: si.modifier.toString(),
          type: valueType,
          keyTypes,
          canBrowse: typeMeta.isMap && typeMeta.asMap.hashers.every((hasher: { toString: () => string }) =>
            [ 'Identity', 'Blake2_128Concat', 'Twox64Concat' ].includes(hasher.toString()),
          ),
          docs: si.docs.map((d: { toString: () => string }) => d.toString()).join(' ').trim(),
        });
      }
      if (items.length > 0) {
        out.push({ name: palletName, storage: items.sort((a, b) => collator.compare(a.name, b.name)) });
      }
    }
    return out.sort((a, b) => collator.compare(a.name, b.name));
  }, [ apiQuery.data ]);

  const reset = React.useCallback(() => {
    generation.current += 1;
    setValues([]);
    setKeysJson('[]');
    setResult(null);
    setError(null);
    setChoices([]);
    setBrowseHash('');
    setBrowseCursor('');
    setHasMore(false);
    setBrowseMessage('');
    setBrowsing(false);
    setIsQuerying(false);
  }, []);

  React.useEffect(() => () => {
    generation.current += 1;
  }, []);

  React.useEffect(() => {
    if (!router.isReady || restoredUrl.current === router.asPath) return;
    restoredUrl.current = router.asPath;
    reset();
    setPallet(typeof router.query.pallet === 'string' ? router.query.pallet : '');
    setItem(typeof router.query.item === 'string' ? router.query.item : '');
    const raw = typeof router.query.keys === 'string' ? router.query.keys : '[]';
    setKeysJson(raw);
    try {
      const keys: unknown = JSON.parse(raw);
      if (!Array.isArray(keys)) throw new Error();
      setValues(keys.map((value) => typeof value === 'string' ? value : JSON.stringify(value)));
    } catch {
      setAdvanced(true);
    }
  }, [ router.isReady, router.asPath, router.query, reset ]);

  const selectedItem = React.useMemo(() => {
    return pallets.find((p) => p.name === pallet)?.storage.find((s) => s.name === item) ?? null;
  }, [ pallets, pallet, item ]);

  const keys = React.useMemo(() => selectedItem?.keyTypes.map((type, index) => describeKey(type, pallet, item, index)) ?? [], [ selectedItem, pallet, item ]);
  let validation = '';
  let parsedKeys: Array<unknown> = [];
  if (selectedItem && apiQuery.data) {
    try {
      parsedKeys = parseLookupKeys(apiQuery.data.api.registry, keys, values, advanced ? keysJson : undefined);
    } catch (error) {
      validation = (error as Error).message;
    }
  }

  function changeValues(next: Array<string>) {
    generation.current += 1;
    setValues(next);
    setResult(null);
    setError(null);
    setIsQuerying(false);
    setBrowsing(false);
  }

  async function browse(more = false) {
    const request = ++generation.current;
    setBrowsing(true);
    setBrowseMessage('');
    try {
      const api = apiQuery.data?.api;
      const hash = more ? browseHash : (await api.rpc.chain.getFinalizedHead()).toHex();
      const snapshot = await api.at(hash);
      const query = snapshot.query[lowerFirst(pallet)][lowerFirst(item)];
      const found = await query.keysPaged({ args: [], pageSize: 20, ...(more ? { startKey: browseCursor } : {}) });
      const decoded = found.map((key: { toHex: () => string; args: Array<{ toString: () => string; toJSON: () => unknown }> }) => ({
        hex: key.toHex(),
        values: key.args.map((arg) => {
          const value = arg.toJSON();
          return typeof value === 'object' ? JSON.stringify(value) : arg.toString();
        }),
      })).filter((key: { values: Array<string> }) => key.values.length === keys.length);
      if (request !== generation.current) return;
      setChoices(more ? [ ...choices, ...decoded ] : decoded);
      setBrowseHash(hash);
      setBrowseCursor(found.at(-1)?.toHex() ?? '');
      setHasMore(found.length === 20);
      let message = 'Choose a stored key to fill the lookup. Listed in storage order, not block or account order.';
      if (decoded.length < found.length) message = 'Some keys use irreversible hashes and cannot be decoded. Enter their original values manually.';
      if (found.length === 0) message = 'No more stored keys at this finalized block. Records may be empty or pruned.';
      setBrowseMessage(message);
    } catch (error) {
      if (request === generation.current) setBrowseMessage(`Could not browse keys: ${ (error as Error).message }`);
    } finally {
      if (request === generation.current) setBrowsing(false);
    }
  }

  async function useFinalizedBlock() {
    const request = ++generation.current;
    setBrowsing(true);
    try {
      const api = apiQuery.data?.api;
      const hash = await api.rpc.chain.getFinalizedHead();
      const header = await api.rpc.chain.getHeader(hash);
      if (request === generation.current) changeValues([ header.number.toString() ]);
    } catch (error) {
      if (request === generation.current) setError((error as Error).message);
    } finally {
      if (request === generation.current) setBrowsing(false);
    }
  }

  async function handleSubmit() {
    if (!apiQuery.data || !selectedItem || validation) return;
    const request = ++generation.current;
    setIsQuerying(true);
    setBrowsing(false);
    setError(null);
    setResult(null);
    try {
      const api = apiQuery.data.api;
      const value = await api.query[lowerFirst(pallet)][lowerFirst(item)](...parsedKeys);
      if (request !== generation.current) return;
      setResult({
        value: value.isNone ?
          'No stored value for these keys. Check the keys or browse existing records; older history may have been pruned.' :
          JSON.stringify(value.toHuman(), null, 2),
        rawHex: value.toHex(),
      });
      const query = { pallet, item, ...(parsedKeys.length ? { keys: JSON.stringify(parsedKeys) } : {}) };
      // Mark the resulting URL before navigation so it does not reset the result.
      restoredUrl.current = `${ router.pathname }?${ new URLSearchParams(query).toString() }`;
      await router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    } catch (error) {
      if (request === generation.current) setError((error as Error).message);
    } finally {
      if (request === generation.current) setIsQuerying(false);
    }
  }

  if (apiQuery.isLoading) {
    return <Skeleton loading={ true } w="100%" h="300px"/>;
  }

  if (apiQuery.isError) {
    return <Box p={ 6 } color="red.500">Failed to connect to chain RPC.</Box>;
  }

  return (
    <>
      <DeveloperSubNav/>
      <PageTitle
        title="Chain State"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Explore live chain storage. Choose a record, find its keys, and read its value.
          </chakra.span>
        ) }
      />

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={ 4 } mb={ 4 }>
        <Box>
          <Text fontSize="sm" mb={ 1 } color="text.secondary">Pallet</Text>
          <chakra.select
            aria-label="Pallet"
            value={ pallet }
            onChange={ (e) => {
              reset();
              setPallet(e.target.value);
              setItem('');
            } }
            w="full"
            p={ 2 }
            borderWidth="1px"
            borderRadius="md"
            bg="transparent"
          >
            <option value="">— select —</option>
            { pallets.map((p) => <option key={ p.name } value={ p.name }>{ p.name }</option>) }
          </chakra.select>
        </Box>

        <Box>
          <Text fontSize="sm" mb={ 1 } color="text.secondary">Storage item</Text>
          <chakra.select
            aria-label="Storage item"
            value={ item }
            onChange={ (e) => {
              reset();
              setItem(e.target.value);
            } }
            disabled={ !pallet }
            w="full"
            p={ 2 }
            borderWidth="1px"
            borderRadius="md"
            bg="transparent"
          >
            <option value="">— select —</option>
            { pallets.find((p) => p.name === pallet)?.storage.map((s) => (
              <option key={ s.name } value={ s.name }>{ s.name }</option>
            )) }
          </chakra.select>
        </Box>

      </Grid>

      { selectedItem && (
        <Box mb={ 4 } p={ 3 } borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: 'whiteAlpha.50' }}>
          <Text fontSize="xs" color="text.secondary" mb={ 1 }>
            <chakra.b fontFamily="mono">{ pallet }.{ item }</chakra.b>
            { selectedItem.keyTypes.length > 0 ? ` (${ selectedItem.keyTypes.join(', ') }) → ` : ': ' }
            <chakra.span fontFamily="mono">{ selectedItem.type }</chakra.span>
            { selectedItem.modifier !== 'Default' && (
              <chakra.span ml={ 2 } color="text.secondary">[{ selectedItem.modifier }]</chakra.span>
            ) }
          </Text>
          { selectedItem.docs && (
            <Text fontSize="xs" color="text.secondary">{ selectedItem.docs }</Text>
          ) }
        </Box>
      ) }

      { selectedItem && (
        <Box borderWidth="1px" borderRadius="lg" p={{ base: 4, md: 6 }} mb={ 6 }>
          <Flex justify="space-between" align="center" gap={ 3 } mb={ 4 } wrap="wrap">
            <Box>
              <Text fontWeight={ 600 }>Lookup values</Text>
              <Text color="text.secondary" fontSize="sm">
                { keys.length ? `${ keys.length } required key value(s)` : 'This storage item needs no keys. You can query it directly.' }
              </Text>
            </Box>
            { keys.length > 0 && (
              <Button size="sm" variant="outline" onClick={ () => {
                if (!advanced) setKeysJson(JSON.stringify(validation ? values : parsedKeys));
                else {
                  try {
                    const parsed = parseLookupKeys(apiQuery.data!.api.registry, keys, [], keysJson);
                    changeValues(parsed.map((value) => typeof value === 'string' ? value : JSON.stringify(value)));
                  } catch {
                    return;
                  }
                }
                setAdvanced(!advanced);
              } }>{ advanced ? 'Guided inputs' : 'Advanced JSON' }</Button>
            ) }
          </Flex>
          { advanced && keys.length > 0 ? (
            <Input aria-label="Keys JSON array" value={ keysJson } onChange={ (event) => {
              changeValues(values);
              setKeysJson(event.target.value);
            } } fontFamily="mono"/>
          ) : keys.map((key, index) => (
            <Box key={ `${ pallet }.${ item }.${ index }` } mb={ 4 }>
              <chakra.label htmlFor={ `lookup-key-${ index }` } display="block" fontSize="sm" mb={ 2 } fontWeight={ 600 }>
                { key.label } <chakra.span color="text.secondary" fontWeight={ 400 }>({ key.type })</chakra.span>
              </chakra.label>
              <Input id={ `lookup-key-${ index }` } aria-describedby={ `lookup-hint-${ index }` }
                value={ values[index] ?? '' } placeholder={ key.blockNumber ? 'Choose a block or enter its number' : `Enter ${ key.type }` }
                onChange={ (event) => {
                  const next = [ ...values ]; next[index] = event.target.value; changeValues(next);
                } }
                fontFamily="mono" inputMode={ /^u\d+$/.test(key.type) ? 'numeric' : 'text' }/>
              <Text id={ `lookup-hint-${ index }` } color="text.secondary" fontSize="sm" mt={ 2 }>{ key.hint }</Text>
            </Box>
          )) }
          { validation && <Text role="status" color="text.secondary" fontSize="sm" mt={ 3 }>{ validation }</Text> }
          { keys.length > 0 && (
            <Box mt={ 4 }>
              <Flex gap={ 3 } wrap="wrap">
                <Button variant="outline" size="sm" onClick={ () => browse() } loading={ browsing } disabled={ isQuerying || !selectedItem.canBrowse }>
                  Browse existing keys
                </Button>
                { keys.length === 1 && keys[0].blockNumber && !advanced && (
                  <Button variant="outline" size="sm" disabled={ browsing || isQuerying } onClick={ useFinalizedBlock }>Use finalized block</Button>
                ) }
              </Flex>
              { !selectedItem.canBrowse && (
                <Text fontSize="sm" color="text.secondary" mt={ 3 }>
                  This map stores irreversible key hashes. Enter the original key values; they cannot be recovered by browsing chain storage.
                </Text>
              ) }
              { browseMessage && <Text role="status" fontSize="sm" color="text.secondary" mt={ 3 }>{ browseMessage }</Text> }
              { choices.length > 0 && (
                <Box mt={ 3 } maxH="240px" overflowY="auto" borderWidth="1px" borderRadius="md">
                  { choices.map((choice) => (
                    <Button key={ choice.hex } variant="plain" width="full" justifyContent="flex-start" height="auto" p={ 3 }
                      whiteSpace="normal" wordBreak="break-all"
                      onClick={ () => {
                        changeValues(choice.values);
                        setKeysJson(JSON.stringify(choice.values.map((value, index) => {
                          try {
                            return parseLookupKeys(apiQuery.data!.api.registry, [ keys[index] ], [ value ])[0];
                          } catch {
                            return value;
                          }
                        })));
                      } }>{ choice.values.join(' · ') }</Button>
                  )) }
                </Box>
              ) }
              { hasMore && <Button size="sm" variant="outline" mt={ 3 } disabled={ browsing } onClick={ () => browse(true) }>Load 20 more keys</Button> }
            </Box>
          ) }
        </Box>
      ) }

      <Flex gap={ 3 } mb={ 6 }>
        <Button onClick={ handleSubmit } disabled={ !selectedItem || Boolean(validation) || isQuerying } loading={ isQuerying }>
          Query
        </Button>
        { result && (
          <Button
            variant="outline"
            onClick={ () => {
              setResult(null);
              setError(null);
            } }
          >
            Clear
          </Button>
        ) }
      </Flex>

      { error && (
        <Box p={ 4 } mb={ 4 } borderWidth="1px" borderRadius="md" color="red.500" bg="red.50" _dark={{ bg: 'red.900/30' }}>
          <Text fontSize="sm" fontFamily="mono">{ error }</Text>
        </Box>
      ) }

      { result && (
        <Box>
          <Text fontSize="sm" fontWeight={ 600 } mb={ 2 }>Result</Text>
          <Code display="block" whiteSpace="pre" p={ 3 } borderRadius="md" fontSize="xs" overflowX="auto" mb={ 2 }>
            { result.value }
          </Code>
          { result.rawHex && (
            <details>
              <Text fontSize="xs" color="text.secondary" as="summary" cursor="pointer">Raw SCALE bytes</Text>
              <Code display="block" whiteSpace="pre-wrap" wordBreak="break-all" p={ 3 } mt={ 1 } borderRadius="md" fontSize="xs">
                { result.rawHex }
              </Code>
            </details>
          ) }
        </Box>
      ) }
    </>
  );
};

function lowerFirst(s: string): string {
  return s.length === 0 ? s : s[0].toLowerCase() + s.slice(1);
}

export default DeveloperChainState;
