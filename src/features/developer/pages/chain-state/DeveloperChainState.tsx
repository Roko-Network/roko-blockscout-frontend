// Developer-console page — read-only metadata-driven UI. The `react/jsx-no-bind`
// rule guards against re-renders from inline handlers; on dev-tool pages
// (rendered rarely, no virtualized lists) the perf cost is negligible and the
// extra useCallback ceremony hurts readability.
/* eslint-disable react/jsx-no-bind */
import { Box, Code, Flex, Grid, Input, Text, chakra } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import { usePolkadotApi } from 'src/features/substrate/hooks/usePolkadotApi';
import PageTitle from 'src/shell/page/title/PageTitle';
import { Button } from 'src/toolkit/chakra/button';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

import DeveloperSubNav from 'src/features/developer/components/DeveloperSubNav';

interface StorageItemInfo {
  name: string;
  modifier: string;
  type: string;
  keyTypes: Array<string>;
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
          valueType = api.registry.lookup.getName(typeMeta.asPlain.toNumber()) ?? '?';
        } else if (typeMeta.isMap) {
          const m = typeMeta.asMap;
          keyTypes = [ api.registry.lookup.getName(m.key.toNumber()) ?? '?' ];
          valueType = api.registry.lookup.getName(m.value.toNumber()) ?? '?';
        }
        items.push({
          name: si.name.toString(),
          modifier: si.modifier.toString(),
          type: valueType,
          keyTypes,
          docs: si.docs.map((d: { toString: () => string }) => d.toString()).join(' ').trim(),
        });
      }
      if (items.length > 0) {
        out.push({ name: palletName, storage: items.sort((a, b) => a.name.localeCompare(b.name)) });
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [ apiQuery.data ]);

  // Restore from URL params on mount, and update them when the user changes selection.
  React.useEffect(() => {
    const p = typeof router.query.pallet === 'string' ? router.query.pallet : '';
    const it = typeof router.query.item === 'string' ? router.query.item : '';
    const kj = typeof router.query.keys === 'string' ? router.query.keys : '';
    if (p && !pallet) setPallet(p);
    if (it && !item) setItem(it);
    if (kj && keysJson === '[]') setKeysJson(kj);
  }, [ router.query, pallet, item, keysJson ]);

  const selectedItem = React.useMemo(() => {
    return pallets.find((p) => p.name === pallet)?.storage.find((s) => s.name === item) ?? null;
  }, [ pallets, pallet, item ]);

  const handleSubmit = React.useCallback(async() => {
    if (!apiQuery.data?.api || !pallet || !item) return;
    setIsQuerying(true);
    setError(null);
    setResult(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api: any = apiQuery.data.api;
      const queryFn = api.query[lowerFirst(pallet)]?.[lowerFirst(item)];
      if (!queryFn) {
        throw new Error(`api.query.${ lowerFirst(pallet) }.${ lowerFirst(item) } not found in metadata`);
      }
      let parsedKeys: Array<unknown> = [];
      if (keysJson.trim().length > 0 && keysJson.trim() !== '[]') {
        const parsed: unknown = JSON.parse(keysJson);
        if (!Array.isArray(parsed)) {
          throw new Error('Keys must be a JSON array — e.g. ["0x…"] or [42]');
        }
        parsedKeys = parsed as Array<unknown>;
      }
      const value = await queryFn(...parsedKeys);
      const rendered = typeof value?.toHuman === 'function' ? JSON.stringify(value.toHuman(), null, 2) : String(value);
      const hex = typeof value?.toHex === 'function' ? value.toHex() : undefined;
      setResult({ value: rendered, rawHex: hex });

      // Update URL for shareability.
      const url = {
        pathname: router.pathname,
        query: {
          pallet,
          item,
          ...(keysJson.trim().length > 0 && keysJson.trim() !== '[]' ? { keys: keysJson } : {}),
        },
      };
      router.replace(url, undefined, { shallow: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsQuerying(false);
    }
  }, [ apiQuery.data, pallet, item, keysJson, router ]);

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
            Read any pallet storage. Equivalent to polkadot.js Apps → Developer → Chain State.
          </chakra.span>
        ) }
      />

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 2fr' }} gap={ 4 } mb={ 4 }>
        <Box>
          <Text fontSize="sm" mb={ 1 } color="text.secondary">Pallet</Text>
          <chakra.select
            value={ pallet }
            onChange={ (e) => {
              setPallet(e.target.value);
              setItem('');
              setKeysJson('[]');
              setResult(null);
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
            value={ item }
            onChange={ (e) => {
              setItem(e.target.value);
              setKeysJson('[]');
              setResult(null);
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

        <Box>
          <Text fontSize="sm" mb={ 1 } color="text.secondary">
            Keys (JSON array) { selectedItem?.keyTypes?.length ? `[${ selectedItem.keyTypes.join(', ') }]` : '(none)' }
          </Text>
          <Input
            value={ keysJson }
            onChange={ (e) => setKeysJson(e.target.value) }
            placeholder='["0x…"] or [42]'
            fontFamily="mono"
            fontSize="sm"
          />
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

      <Flex gap={ 3 } mb={ 6 }>
        <Button onClick={ handleSubmit } disabled={ !pallet || !item || isQuerying } loading={ isQuerying }>
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
