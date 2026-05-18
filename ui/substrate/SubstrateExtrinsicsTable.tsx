import { Box, chakra } from '@chakra-ui/react';
import React from 'react';

import { route } from 'nextjs-routes';

import type { SubstrateExtrinsic } from 'lib/api/services/general/substrateApi';
import {
  formatRoko,
  isEthereumTransactExtrinsic,
  summarizeArgs,
  truncateHex,
} from 'lib/api/services/general/substrateApi';
import { Link } from 'toolkit/chakra/link';
import { TableRoot, TableHeader, TableBody, TableRow, TableColumnHeader, TableCell } from 'toolkit/chakra/table';

interface Props {
  items: Array<SubstrateExtrinsic>;

  /** Hide the "Block" column when this table is already in a block-detail context. */
  hideBlockColumn?: boolean;
}

function ExtrinsicLink({ ext, children }: { ext: SubstrateExtrinsic; children: React.ReactNode }) {
  // Sprint 5 design: ethereum.transact extrinsics deep-link to the existing
  // EVM tx page so we don't duplicate-render EVM tx details. The eth_tx_hash
  // is stashed in args by the sidecar — fall back to the substrate extrinsic
  // page if it's missing.
  if (isEthereumTransactExtrinsic(ext)) {
    const ethHash = (ext.args && typeof ext.args.eth_tx_hash === 'string') ? ext.args.eth_tx_hash : null;
    if (ethHash) {
      return <Link href={ route({ pathname: '/tx/[hash]', query: { hash: ethHash } }) }>{ children }</Link>;
    }
  }
  return (
    <Link
      href={ route({
        pathname: '/extrinsic/[block]/[index]',
        query: { block: String(ext.block_number), index: String(ext.index_in_block) },
      }) }
    >
      { children }
    </Link>
  );
}

const SubstrateExtrinsicsTable = ({ items, hideBlockColumn }: Props) => {
  if (items.length === 0) {
    return <Box p={ 4 } color="text.secondary" fontSize="sm">No substrate extrinsics.</Box>;
  }

  return (
    <TableRoot variant="line">
      <TableHeader>
        <TableRow>
          { !hideBlockColumn && <TableColumnHeader>Block</TableColumnHeader> }
          <TableColumnHeader>Index</TableColumnHeader>
          <TableColumnHeader>Pallet.Method</TableColumnHeader>
          <TableColumnHeader>Signer</TableColumnHeader>
          <TableColumnHeader>Args</TableColumnHeader>
          <TableColumnHeader>Result</TableColumnHeader>
          <TableColumnHeader>Fee</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        { items.map((ext) => (
          <TableRow key={ ext.id }>
            { !hideBlockColumn && (
              <TableCell fontFamily="mono">
                <Link href={ route({ pathname: '/block/[height_or_hash]', query: { height_or_hash: String(ext.block_number) } }) }>
                  { ext.block_number.toLocaleString() }
                </Link>
              </TableCell>
            ) }
            <TableCell fontFamily="mono">{ ext.index_in_block }</TableCell>
            <TableCell>
              <ExtrinsicLink ext={ ext }>
                <chakra.span fontFamily="mono">{ ext.pallet }.{ ext.method }</chakra.span>
              </ExtrinsicLink>
              { isEthereumTransactExtrinsic(ext) && (
                <chakra.span ml={ 2 } fontSize="xs" color="blue.500">EVM</chakra.span>
              ) }
            </TableCell>
            <TableCell fontFamily="mono">
              { ext.signer ? (
                <Link href={ route({ pathname: '/address/[hash]', query: { hash: ext.signer } }) }>
                  { truncateHex(ext.signer, 6, 4) }
                </Link>
              ) : (
                <chakra.span color="text.secondary" fontSize="xs">{ ext.extrinsic_class }</chakra.span>
              ) }
            </TableCell>
            <TableCell fontFamily="mono" fontSize="xs" maxW="320px" title={ JSON.stringify(ext.args) }>
              { summarizeArgs(ext.args, 80) }
            </TableCell>
            <TableCell>
              { ext.success ? (
                <chakra.span color="green.500" fontWeight={ 600 }>✓</chakra.span>
              ) : (
                <chakra.span color="red.500" fontWeight={ 600 } title={ JSON.stringify(ext.error) }>✗</chakra.span>
              ) }
            </TableCell>
            <TableCell fontFamily="mono" fontSize="xs">
              { ext.fee_paid ? formatRoko(ext.fee_paid) : '—' }
            </TableCell>
          </TableRow>
        )) }
      </TableBody>
    </TableRoot>
  );
};

export default SubstrateExtrinsicsTable;
