// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Grid, chakra } from '@chakra-ui/react';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import DeveloperSubNav from 'src/features/developer/components/DeveloperSubNav';
import { polkadotAppsLink, usePolkadotApi } from 'src/features/substrate/hooks/usePolkadotApi';

import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Card {
  title: string;
  description: string;
  href?: string;
  external?: string;
}

interface ConnectionStatusProps {
  isError: boolean;
  errorMessage: string | null;
  data: { chain: string; endpoint: string; transport: 'http' | 'ws'; nodeName: string; nodeVersion: string } | null;
}

function ConnectionStatus({ isError, errorMessage, data }: ConnectionStatusProps) {
  if (isError) {
    return (
      <chakra.span color="red.500" fontSize="sm">
        Failed to connect to the chain. The Developer Console needs the public RPC at{ ' ' }
        <chakra.code>{ errorMessage ?? '?' }</chakra.code> to be reachable.
      </chakra.span>
    );
  }
  if (!data) {
    return <chakra.span fontSize="sm">Connecting to chain…</chakra.span>;
  }
  return (
    <chakra.span fontSize="sm" color="text.secondary">
      Connected to <chakra.b>{ data.chain }</chakra.b>{ ' ' }
      via <chakra.code fontSize="xs">{ data.endpoint }</chakra.code>{ ' ' }
      ({ data.nodeName } { data.nodeVersion }, { data.transport === 'ws' ? 'WebSocket' : 'HTTP' }).
    </chakra.span>
  );
}

const CARDS: Array<Card> = [
  {
    title: 'Chain State',
    description: 'Read any pallet storage. Equivalent to polkadot.js Apps → Developer → Chain State.',
    href: '/developer/chain-state',
  },
  {
    title: 'Constants',
    description: 'Browse compile-time runtime constants per pallet (block time, era length, deposit thresholds, etc.).',
    href: '/developer/constants',
  },
  {
    title: 'RPC Calls',
    description: 'Call substrate RPCs and Roko\'s custom temporal_* runtime APIs (mesh state, checkpoint, queue stats).',
    href: '/developer/rpc',
  },
  {
    title: 'Runtime Metadata',
    description: 'Browse every pallet\'s storage items, events, errors, and calls as a searchable tree.',
    href: '/developer/metadata',
  },
];

const DeveloperConsole = () => {
  const apiQuery = usePolkadotApi();

  return (
    <>
      <DeveloperSubNav/>
      <PageTitle
        title="Developer Console"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Read chain state, browse runtime metadata, call RPC methods — without leaving the explorer.
          </chakra.span>
        ) }
      />

      <Box
        mb={ 6 }
        p={ 4 }
        borderWidth="1px"
        borderRadius="md"
        bg={ apiQuery.isError ? 'red.50' : undefined }
        _dark={{ bg: apiQuery.isError ? 'red.900/30' : undefined }}
      >
        <Skeleton loading={ apiQuery.isLoading }>
          <ConnectionStatus
            isError={ apiQuery.isError }
            errorMessage={ apiQuery.error instanceof Error ? apiQuery.error.message : null }
            data={ apiQuery.data ?? null }
          />
        </Skeleton>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={ 4 } mb={ 6 }>
        { CARDS.map((card) => {
          const inner = (
            <Box
              borderWidth="2px"
              borderColor="border.divider"
              borderRadius="base"
              bg="bg.elevated"
              p={ 5 }
              h="full"
              _hover={{ borderColor: 'brand.accentText' }}
            >
              <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 2 }>{ card.title }</chakra.h3>
              <chakra.p fontSize="sm" color="text.secondary">{ card.description }</chakra.p>
            </Box>
          );
          if (card.href) {
            // The href on each card is one of the typed Developer routes —
            // unsafe cast is fine because we control the CARDS table above.
            return (
              <chakra.a
                key={ card.title }
                href={ card.href }
                _hover={{ textDecoration: 'none' }}
              >
                { inner }
              </chakra.a>
            );
          }
          return <chakra.a key={ card.title } href={ card.external } target="_blank" rel="noopener">{ inner }</chakra.a>;
        }) }
      </Grid>

      <Box
        borderWidth="2px"
        borderColor="border.divider"
        borderRadius="base"
        bg="bg.elevated"
        p={ 5 }
      >
        <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 2 }>Submit Extrinsic</chakra.h3>
        <chakra.p fontSize="sm" color="text.secondary" mb={ 2 }>
          Signing and submitting transactions requires a wallet/keyring. Use polkadot.js Apps,
          which handles browser-extension integration — the link below pre-connects it to this chain.
        </chakra.p>
        <chakra.p fontSize="xs" color="text.secondary" mb={ 4 }>
          Note: Roko testnet currently exposes HTTPS RPC only (no WebSocket). polkadot.js Apps
          may fail to connect via the deep-link until a WS endpoint is added. For now, use it
          locally and point it at a local <chakra.code>roko-node --rpc-port 9944 --ws-port 9944</chakra.code>.
        </chakra.p>
        <Flex gap={ 3 } align="center">
          <chakra.a
            href={ polkadotAppsLink('/extrinsics') }
            target="_blank"
            rel="noopener"
            display="inline-block"
            px={ 4 }
            py={ 2 }
            borderRadius="md"
            bg="blue.500"
            color="white"
            fontWeight={ 600 }
            fontSize="sm"
            _hover={{ bg: 'blue.600' }}
          >
            Open polkadot.js Apps →
          </chakra.a>
          <chakra.span fontSize="xs" color="text.secondary">opens in new tab</chakra.span>
        </Flex>
      </Box>
    </>
  );
};

export default DeveloperConsole;
