// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import BigNumber from 'bignumber.js';
import React from 'react';

import type { AddressQuery } from 'src/slices/address/hooks/useAddressQuery';
import BlockEntity from 'src/slices/block/components/entity/BlockEntity';
import { currencyUnits } from 'src/slices/chain/units';

import NativeCoinValue from 'src/shared/values/entity/NativeCoinValue';

import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  query: AddressQuery;
  transactionCount?: string | number;
  countersLoading: boolean;
  countersError: boolean;
}

const AddressOverview = ({ query, transactionCount, countersLoading, countersError }: Props) => {
  const pending = query.isPlaceholderData;
  const data = query.isError || query.isDegradedData ? undefined : query.data;
  let countLabel = 'Unavailable';
  if (!countersError && transactionCount !== undefined) {
    const count = BigNumber(transactionCount);
    if (count.isInteger() && !count.isNegative()) {
      countLabel = count.toFormat(0);
    }
  }
  const block = data?.block_number_balance_updated_at;
  const balance = data?.coin_balance;
  let balanceContent = <Text fontSize="md">Balance unavailable</Text>;
  if (pending) {
    balanceContent = <Skeleton loading h="8" w="40"/>;
  } else if (balance !== null && balance !== undefined) {
    balanceContent = <NativeCoinValue amount={ balance } exchangeRate={ null }/>;
  }
  let blockContent = <Text fontSize="md">No block available</Text>;
  if (pending) {
    blockContent = <Skeleton loading h="8" w="28"/>;
  } else if (block !== null && block !== undefined) {
    blockContent = <BlockEntity number={ block }/>;
  }
  return (
    <SimpleGrid columns={{ base: 2, md: 3 }} gap={ 3 } mb={ 6 } aria-label="Address at a glance">
      <Box gridColumn={{ base: 'span 2', md: 'auto' }} p={{ base: 4, md: 5 }} borderRadius="xl" borderWidth="1px"
        borderColor={{ _light: 'teal.300', _dark: 'teal.700' }}
        bg={{ _light: 'teal.50', _dark: 'whiteAlpha.50' }} minW={ 0 }>
        <Text fontSize="sm" color="text.secondary" mb={ 2 }>Native { currencyUnits.ether } balance</Text>
        <Box fontSize="2xl" fontWeight="semibold" minH="36px">
          { balanceContent }
        </Box>
        <Text mt={ 2 } fontSize="xs" color="text.secondary">Reported native balance. Token holdings and staking activity are shown separately.</Text>
      </Box>
      <Box p={{ base: 4, md: 5 }} borderRadius="xl" borderWidth="1px" borderColor="border.divider" minW={ 0 }>
        <Text fontSize="sm" color="text.secondary" mb={ 2 }>Indexed transactions</Text>
        <Box fontSize="2xl" fontWeight="semibold" minH="36px">
          { countersLoading ? <Skeleton loading h="8" w="20"/> : (
            <Text>{ countLabel }</Text>
          ) }
        </Box>
        <Text mt={ 2 } fontSize="xs" color="text.secondary">EVM activity involving this address. Native calls have their own view.</Text>
      </Box>
      <Box p={{ base: 4, md: 5 }} borderRadius="xl" borderWidth="1px" borderColor="border.divider" minW={ 0 }>
        <Text fontSize="sm" color="text.secondary" mb={ 2 }>Balance last recorded at</Text>
        <Box fontSize="xl" fontWeight="semibold" minH="36px">
          { blockContent }
        </Box>
        <Text mt={ 2 } fontSize="xs" color="text.secondary">A reference block for the balance, not a live sync or finality indicator.</Text>
      </Box>
    </SimpleGrid>
  );
};

export default React.memo(AddressOverview);
