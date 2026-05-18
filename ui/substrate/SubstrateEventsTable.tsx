import { Box, chakra } from '@chakra-ui/react';
import React from 'react';

import { route } from 'nextjs-routes';

import type { SubstrateEvent } from 'lib/api/services/general/substrateApi';
import { Link } from 'toolkit/chakra/link';
import { TableRoot, TableHeader, TableBody, TableRow, TableColumnHeader, TableCell } from 'toolkit/chakra/table';

interface Props {
  items: Array<SubstrateEvent>;

  /** Hide the "Extrinsic" link column when rendered inside a single extrinsic's detail. */
  hideExtrinsicColumn?: boolean;
}

function phaseColor(phase: string): string {
  if (phase === 'Initialization') return 'blue.500';
  if (phase === 'Finalization') return 'purple.500';
  return 'gray.500';
}

function summarizeData(data: Record<string, unknown> | null): string {
  if (!data) return '—';
  const s = JSON.stringify(data);
  if (s.length <= 120) return s;
  return `${ s.slice(0, 119) }…`;
}

const SubstrateEventsTable = ({ items, hideExtrinsicColumn }: Props) => {
  if (items.length === 0) {
    return <Box p={ 4 } color="text.secondary" fontSize="sm">No events.</Box>;
  }

  return (
    <TableRoot variant="line">
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Index</TableColumnHeader>
          <TableColumnHeader>Phase</TableColumnHeader>
          { !hideExtrinsicColumn && <TableColumnHeader>Extrinsic</TableColumnHeader> }
          <TableColumnHeader>Pallet.Method</TableColumnHeader>
          <TableColumnHeader>Data</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        { items.map((ev) => (
          <TableRow key={ ev.id }>
            <TableCell fontFamily="mono">{ ev.index_in_block }</TableCell>
            <TableCell>
              <chakra.span
                px={ 2 }
                py={ 0.5 }
                borderRadius="md"
                fontSize="xs"
                fontWeight={ 600 }
                color="white"
                bg={ phaseColor(ev.phase) }
              >
                { ev.phase === 'ApplyExtrinsic' ? `ext #${ ev.extrinsic_index }` : ev.phase }
              </chakra.span>
            </TableCell>
            { !hideExtrinsicColumn && (
              <TableCell fontFamily="mono">
                { ev.extrinsic_index !== null ? (
                  <Link
                    href={ route({
                      pathname: '/extrinsic/[block]/[index]',
                      query: { block: String(ev.block_number), index: String(ev.extrinsic_index) },
                    }) }
                  >
                    #{ ev.extrinsic_index }
                  </Link>
                ) : '—' }
              </TableCell>
            ) }
            <TableCell fontFamily="mono">{ ev.pallet }.{ ev.method }</TableCell>
            <TableCell fontFamily="mono" fontSize="xs" maxW="400px" title={ JSON.stringify(ev.data) }>
              { summarizeData(ev.data) }
            </TableCell>
          </TableRow>
        )) }
      </TableBody>
    </TableRoot>
  );
};

export default SubstrateEventsTable;
