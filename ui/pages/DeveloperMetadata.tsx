/* eslint-disable react/jsx-no-bind, max-len */
import { Box, Code, Flex, Input, Text, chakra } from '@chakra-ui/react';
import React from 'react';

import { usePolkadotApi } from 'lib/polkadot/useApi';
import { Skeleton } from 'toolkit/chakra/skeleton';
import PageTitle from 'ui/shared/Page/PageTitle';

import DeveloperSubNav from './DeveloperSubNav';

interface PalletEntry {
  name: string;
  calls: Array<{ name: string; args: Array<string>; docs: string }>;
  events: Array<{ name: string; fields: Array<string>; docs: string }>;
  errors: Array<{ name: string; docs: string }>;
  storage: Array<{ name: string; type: string; docs: string }>;
  constants: Array<{ name: string; type: string; docs: string }>;
}

const SECTION_LABELS = {
  calls: 'Calls',
  events: 'Events',
  errors: 'Errors',
  storage: 'Storage',
  constants: 'Constants',
} as const;

const DeveloperMetadata = () => {
  const apiQuery = usePolkadotApi();
  const [ filter, setFilter ] = React.useState('');
  const [ expanded, setExpanded ] = React.useState<Set<string>>(new Set());

  const pallets: Array<PalletEntry> = React.useMemo(() => {
    if (!apiQuery.data?.api) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api: any = apiQuery.data.api;
    const out: Array<PalletEntry> = [];
    const metaPallets = api.runtimeMetadata.asLatest.pallets;
    for (const p of metaPallets) {
      const palletName = p.name.toString();
      const calls = p.calls.isSome ? (api.registry.lookup.getSiType(p.calls.unwrap().type.toNumber()).def.toJSON() as { Variant?: { variants: Array<{ name: string; fields?: Array<{ typeName?: string; name?: string }>; docs?: Array<string> }> } }).Variant?.variants ?? [] : [];
      const events = p.events.isSome ? (api.registry.lookup.getSiType(p.events.unwrap().type.toNumber()).def.toJSON() as { Variant?: { variants: Array<{ name: string; fields?: Array<{ typeName?: string; name?: string }>; docs?: Array<string> }> } }).Variant?.variants ?? [] : [];
      const errors = p.errors.isSome ? (api.registry.lookup.getSiType(p.errors.unwrap().type.toNumber()).def.toJSON() as { Variant?: { variants: Array<{ name: string; docs?: Array<string> }> } }).Variant?.variants ?? [] : [];
      const storage = p.storage.isSome ? p.storage.unwrap().items.map((si: { name: { toString: () => string }; type: { isPlain: boolean; isMap: boolean; asPlain: { toNumber: () => number }; asMap: { value: { toNumber: () => number } } }; docs: Array<{ toString: () => string }> }) => {
        const t = si.type;
        let typeName = '?';
        if (t.isPlain) typeName = api.registry.lookup.getName(t.asPlain.toNumber()) ?? '?';
        else if (t.isMap) typeName = api.registry.lookup.getName(t.asMap.value.toNumber()) ?? '?';
        return { name: si.name.toString(), type: typeName, docs: si.docs.map((d) => d.toString()).join(' ').trim() };
      }) : [];
      const constants = p.constants.map((c: { name: { toString: () => string }; type: { toNumber: () => number }; docs: Array<{ toString: () => string }> }) => ({
        name: c.name.toString(),
        type: api.registry.lookup.getName(c.type.toNumber()) ?? '?',
        docs: c.docs.map((d) => d.toString()).join(' ').trim(),
      }));
      out.push({
        name: palletName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        calls: calls.map((v: any) => ({
          name: v.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: (v.fields ?? []).map((f: any) => f.typeName ?? f.name ?? '?'),
          docs: (v.docs ?? []).join(' ').trim(),
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events: events.map((v: any) => ({
          name: v.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fields: (v.fields ?? []).map((f: any) => f.typeName ?? f.name ?? '?'),
          docs: (v.docs ?? []).join(' ').trim(),
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errors: errors.map((v: any) => ({
          name: v.name,
          docs: (v.docs ?? []).join(' ').trim(),
        })),
        storage,
        constants,
      });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [ apiQuery.data ]);

  const filtered = React.useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return pallets;
    return pallets.filter((p) => p.name.toLowerCase().includes(f));
  }, [ pallets, filter ]);

  if (apiQuery.isLoading) return <Skeleton loading={ true } w="100%" h="300px"/>;
  if (apiQuery.isError) return <Box p={ 6 } color="red.500">Failed to connect to chain RPC.</Box>;

  const togglePallet = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <>
      <DeveloperSubNav/>
      <PageTitle
        title="Runtime Metadata"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Every pallet's calls, events, errors, storage items, and constants.
            Useful for integration developers building tooling against the chain.
          </chakra.span>
        ) }
      />

      <Flex mb={ 4 } align="center" gap={ 3 }>
        <Input
          placeholder="Filter pallets"
          value={ filter }
          onChange={ (e) => setFilter(e.target.value) }
          maxW="500px"
        />
        <Text fontSize="sm" color="text.secondary">{ filtered.length } of { pallets.length } pallets</Text>
      </Flex>

      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
        { filtered.map((p, idx) => {
          const isOpen = expanded.has(p.name);
          return (
            <Box
              key={ p.name }
              borderBottomWidth={ idx < filtered.length - 1 ? '1px' : 0 }
              borderColor={{ _light: 'gray.100', _dark: 'whiteAlpha.100' }}
            >
              <chakra.button
                type="button"
                onClick={ () => togglePallet(p.name) }
                display="flex"
                w="full"
                p={ 3 }
                alignItems="center"
                justifyContent="space-between"
                textAlign="left"
                _hover={{ bg: 'gray.50' }}
                _dark={{ _hover: { bg: 'whiteAlpha.100' } }}
              >
                <Flex align="center" gap={ 2 }>
                  <chakra.span fontSize="xs" color="text.secondary">{ isOpen ? '▼' : '▶' }</chakra.span>
                  <chakra.span fontFamily="mono" fontWeight={ 600 }>{ p.name }</chakra.span>
                </Flex>
                <chakra.span fontSize="xs" color="text.secondary">
                  { p.calls.length } calls · { p.events.length } events · { p.errors.length } errors ·{ ' ' }
                  { p.storage.length } storage · { p.constants.length } consts
                </chakra.span>
              </chakra.button>

              { isOpen && (
                <Box p={ 3 } pt={ 0 }>
                  { (Object.keys(SECTION_LABELS) as Array<keyof typeof SECTION_LABELS>).map((section) => {
                    const items = p[section] as Array<{ name: string; type?: string; args?: Array<string>; fields?: Array<string>; docs: string }>;
                    if (items.length === 0) return null;
                    return (
                      <Box key={ section } mt={ 3 } pl={ 6 }>
                        <chakra.h4 fontWeight={ 600 } fontSize="xs" color="text.secondary" textTransform="uppercase" mb={ 1 }>
                          { SECTION_LABELS[section] }
                        </chakra.h4>
                        { items.map((entry) => (
                          <Flex key={ entry.name } direction="column" gap={ 0 } mb={ 2 }>
                            <Code fontSize="xs" p={ 1 } bg="transparent">
                              { entry.name }
                              { entry.type && <chakra.span color="text.secondary">: { entry.type }</chakra.span> }
                              { entry.args && entry.args.length > 0 && (
                                <chakra.span color="text.secondary">({ entry.args.join(', ') })</chakra.span>
                              ) }
                              { entry.fields && entry.fields.length > 0 && (
                                <chakra.span color="text.secondary">{ '{ ' }{ entry.fields.join(', ') }{ ' }' }</chakra.span>
                              ) }
                            </Code>
                            { entry.docs && (
                              <Text fontSize="xs" color="text.secondary" pl={ 2 }>{ entry.docs }</Text>
                            ) }
                          </Flex>
                        )) }
                      </Box>
                    );
                  }) }
                </Box>
              ) }
            </Box>
          );
        }) }
      </Box>
    </>
  );
};

export default DeveloperMetadata;
