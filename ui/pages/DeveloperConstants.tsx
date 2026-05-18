/* eslint-disable react/jsx-no-bind */
import { Box, Code, Flex, Input, Text, chakra } from '@chakra-ui/react';
import React from 'react';

import { usePolkadotApi } from 'lib/polkadot/useApi';
import { Skeleton } from 'toolkit/chakra/skeleton';
import PageTitle from 'ui/shared/Page/PageTitle';

import DeveloperSubNav from './DeveloperSubNav';

interface ConstantInfo {
  pallet: string;
  name: string;
  type: string;
  value: string;
  docs: string;
}

const DeveloperConstants = () => {
  const apiQuery = usePolkadotApi();
  const [ filter, setFilter ] = React.useState('');

  const constants: Array<ConstantInfo> = React.useMemo(() => {
    if (!apiQuery.data?.api) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api: any = apiQuery.data.api;
    const out: Array<ConstantInfo> = [];
    const metaPallets = api.registry.metadata.asLatest.pallets;
    for (const p of metaPallets) {
      const palletName = p.name.toString();
      const palletKey = palletName.charAt(0).toLowerCase() + palletName.slice(1);
      const consts = api.consts[palletKey];
      if (!consts) continue;
      for (const c of p.constants) {
        const name = c.name.toString();
        const constKey = name.charAt(0).toLowerCase() + name.slice(1);
        const valueObj = consts[constKey];
        if (!valueObj) continue;
        const typeName = api.registry.lookup.getName(c.type.toNumber()) ?? '?';
        const value = typeof valueObj.toHuman === 'function' ? JSON.stringify(valueObj.toHuman()) : String(valueObj);
        out.push({
          pallet: palletName,
          name,
          type: typeName,
          value,
          docs: c.docs.map((d: { toString: () => string }) => d.toString()).join(' ').trim(),
        });
      }
    }
    return out.sort((a, b) => a.pallet === b.pallet ? a.name.localeCompare(b.name) : a.pallet.localeCompare(b.pallet));
  }, [ apiQuery.data ]);

  const filtered = React.useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return constants;
    return constants.filter((c) =>
      c.pallet.toLowerCase().includes(f) ||
      c.name.toLowerCase().includes(f) ||
      c.value.toLowerCase().includes(f),
    );
  }, [ constants, filter ]);

  if (apiQuery.isLoading) return <Skeleton loading={ true } w="100%" h="300px"/>;
  if (apiQuery.isError) return <Box p={ 6 } color="red.500">Failed to connect to chain RPC.</Box>;

  return (
    <>
      <DeveloperSubNav/>
      <PageTitle
        title="Constants"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Compile-time runtime constants for each pallet — block time, era length, deposit thresholds, etc.
          </chakra.span>
        ) }
      />

      <Flex mb={ 4 } align="center" gap={ 3 }>
        <Input
          placeholder="Filter by pallet, name, or value"
          value={ filter }
          onChange={ (e) => setFilter(e.target.value) }
          maxW="500px"
        />
        <Text fontSize="sm" color="text.secondary">{ filtered.length } of { constants.length }</Text>
      </Flex>

      <Box borderWidth="1px" borderRadius="md" overflow="hidden">
        { filtered.map((c, idx) => (
          <Flex
            key={ `${ c.pallet }.${ c.name }` }
            p={ 3 }
            borderBottomWidth={ idx < filtered.length - 1 ? '1px' : 0 }
            borderColor={{ _light: 'gray.100', _dark: 'whiteAlpha.100' }}
            direction="column"
            gap={ 1 }
          >
            <Flex justify="space-between" wrap="wrap" gap={ 2 }>
              <chakra.span fontWeight={ 600 } fontFamily="mono" fontSize="sm">
                <chakra.span color="purple.500">{ c.pallet }</chakra.span>.{ c.name }
              </chakra.span>
              <chakra.span fontSize="xs" color="text.secondary" fontFamily="mono">{ c.type }</chakra.span>
            </Flex>
            <Code display="block" fontSize="xs" p={ 2 } borderRadius="md" whiteSpace="pre-wrap" wordBreak="break-all">
              { c.value }
            </Code>
            { c.docs && <Text fontSize="xs" color="text.secondary">{ c.docs }</Text> }
          </Flex>
        )) }
      </Box>
    </>
  );
};

export default DeveloperConstants;
