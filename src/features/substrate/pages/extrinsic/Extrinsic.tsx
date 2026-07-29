// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Code, Flex, Grid, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { route } from 'nextjs-routes';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import BlockWithTimestamp from 'src/slices/block/components/BlockWithTimestamp';

import type { SubstrateExtrinsicWithEvents } from 'src/features/substrate/api/substrate-api';
import {
  fetchExtrinsicByHash,
  fetchBlockExtrinsics,
  formatRoko,
  isEthereumTransactExtrinsic,
  truncateHex,
} from 'src/features/substrate/api/substrate-api';
import SubstrateEventsTable from 'src/features/substrate/components/SubstrateEventsTable';
import { fetchTemporalTxTimestamp } from 'src/features/temporal/api/temporal-rpc';

import getQueryParamString from 'src/shared/router/get-query-param-string';

import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Flex
      justifyContent="space-between"
      alignItems="baseline"
      py={ 2 }
      borderBottomWidth="1px"
      borderColor={{ _light: 'gray.100', _dark: 'whiteAlpha.100' }}
      _last={{ borderBottomWidth: 0 }}
      gap={ 4 }
    >
      <chakra.span fontSize="sm" color="text.secondary" flexShrink={ 0 }>{ label }</chakra.span>
      <chakra.span fontSize="sm" fontWeight={ 600 } fontFamily="mono" textAlign="right" wordBreak="break-all">
        { value }
      </chakra.span>
    </Flex>
  );
}

const Extrinsic = () => {
  const router = useRouter();
  const blockStr = getQueryParamString(router.query.block);
  const indexStr = getQueryParamString(router.query.index);
  const block = Number(blockStr);
  const index = Number(indexStr);

  // We don't have a /extrinsics/by-block-index/... endpoint; instead we fetch
  // the whole block's extrinsics and pick out the one at this index. That
  // also gives us free access to the block's other extrinsics for the
  // "siblings" sub-section if we want to add it later.
  const { data: blockData, isLoading: blockLoading } = useQuery({
    queryKey: [ 'substrate_block_extrinsics', block ],
    queryFn: () => fetchBlockExtrinsics(block),
    enabled: Number.isFinite(block),
  });

  const ext = React.useMemo(() => {
    return blockData?.items?.find((e) => e.index_in_block === index) ?? null;
  }, [ blockData, index ]);

  // Once we have the extrinsic's hash, fetch /extrinsics/:hash to get the
  // joined events list (which the block-extrinsics endpoint doesn't include).
  const { data: hashData, isLoading: hashLoading } = useQuery<SubstrateExtrinsicWithEvents | null>({
    queryKey: [ 'substrate_extrinsic_by_hash', ext?.hash ],
    queryFn: () => fetchExtrinsicByHash(ext!.hash as string),
    enabled: Boolean(ext?.hash),
  });
  const { data: temporalTimestamp } = useQuery({
    queryKey: [ 'temporal_tx_timestamp', ext?.hash ],
    queryFn: () => fetchTemporalTxTimestamp(ext!.hash as string),
    enabled: Boolean(ext?.hash),
    retry: false,
    staleTime: Infinity,
  });

  // Sprint-5 design: ethereum.transact extrinsics redirect to the existing
  // EVM tx page after a short banner so we don't duplicate the EVM rendering.
  React.useEffect(() => {
    if (!ext || !isEthereumTransactExtrinsic(ext)) return;
    const ethHash = (ext.args && typeof ext.args.eth_tx_hash === 'string') ? ext.args.eth_tx_hash : null;
    if (!ethHash) return;
    const t = setTimeout(() => {
      router.replace({ pathname: '/tx/[hash]', query: { hash: ethHash } });
    }, 1500);
    return () => clearTimeout(t);
  }, [ ext, router ]);

  if (!Number.isFinite(block) || !Number.isFinite(index)) {
    return <Box p={ 4 }>Invalid extrinsic URL.</Box>;
  }

  if (blockLoading) {
    return <Skeleton loading={ true } w="100%" h="200px"/>;
  }

  if (!ext) {
    return (
      <Box p={ 6 } borderWidth="1px" borderRadius="md" color="red.500">
        Extrinsic { index } not found in block { block.toLocaleString() }.
        The sidecar may not have indexed this block yet, or the index is out of range.
      </Box>
    );
  }

  const isEvm = isEthereumTransactExtrinsic(ext);

  return (
    <>
      <PageTitle
        title={ `${ ext.pallet }.${ ext.method }` }
        secondRow={ (
          <Flex alignItems="center" gap={ 2 } fontSize="sm" color="text.secondary">
            <BlockWithTimestamp
              number={ block }
              timestamp={ ext.block_timestamp }
              timestampNs={ temporalTimestamp?.timestamp_ns }
              enableTimeIncrement
              layout="horizontal"
            />
            <chakra.span fontFamily="mono">· Index { index }</chakra.span>
          </Flex>
        ) }
      />

      { isEvm && (
        <Box p={ 4 } mb={ 4 } borderWidth="1px" borderRadius="md" bg="blue.50" _dark={{ bg: 'blue.900/30' }}>
          <chakra.span fontWeight={ 600 }>This is an EVM transaction.</chakra.span>{ ' ' }
          Redirecting to the EVM tx view…
        </Box>
      ) }

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={ 4 } mb={ 6 }>
        <Box borderWidth="1px" borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }} borderRadius="xl" p={ 5 }>
          <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 4 }>Extrinsic</chakra.h3>
          <StatRow label="Class" value={ ext.extrinsic_class }/>
          <StatRow
            label="Result"
            value={ ext.success ? (
              <chakra.span color="green.500">✓ Success</chakra.span>
            ) : (
              <chakra.span color="red.500">✗ Failed</chakra.span>
            ) }
          />
          <StatRow
            label="Signer"
            value={ ext.signer ? (
              <Link href={ route({ pathname: '/address/[hash]', query: { hash: ext.signer } }) }>
                { truncateHex(ext.signer, 8, 6) }
              </Link>
            ) : '— (inherent/unsigned)' }
          />
          <StatRow label="Fee paid" value={ ext.fee_paid ? `${ formatRoko(ext.fee_paid) } ROKO` : '—' }/>
          <StatRow label="Tip" value={ ext.tip ? `${ formatRoko(ext.tip) } ROKO` : '—' }/>
          <StatRow label="Nonce" value={ ext.nonce ?? '—' }/>
          <StatRow label="Era" value={ ext.era ? JSON.stringify(ext.era) : '—' }/>
        </Box>

        <Box borderWidth="1px" borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }} borderRadius="xl" p={ 5 }>
          <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 4 }>Hashes</chakra.h3>
          <StatRow label="Extrinsic hash" value={ ext.hash ?? '—' }/>
          <StatRow label="Call hash" value={ ext.call_hash ?? '—' }/>
          <StatRow label="Block hash" value={ ext.block_hash ?? '—' }/>
        </Box>
      </Grid>

      <Box mb={ 6 }>
        <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 3 }>Arguments</chakra.h3>
        { ext.args_truncated ? (
          <Box p={ 4 } borderWidth="1px" borderRadius="md" color="orange.500" fontSize="sm">
            Arguments truncated (oversize payload — e.g. system.setCode).
            Use the substrate RPC to fetch the full extrinsic.
          </Box>
        ) : (
          <Code display="block" whiteSpace="pre" p={ 3 } borderRadius="md" fontSize="xs" overflowX="auto">
            { JSON.stringify(ext.args, null, 2) }
          </Code>
        ) }
      </Box>

      <Box mb={ 6 }>
        <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 3 }>Events emitted</chakra.h3>
        { hashLoading ? (
          <Skeleton loading={ true } w="100%" h="120px"/>
        ) : (
          <SubstrateEventsTable items={ hashData?.events ?? [] } hideExtrinsicColumn/>
        ) }
      </Box>
    </>
  );
};

export default Extrinsic;
