// SPDX-License-Identifier: LicenseRef-Blockscout

import {
  Box,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';

import type { schemas } from '@blockscout/api-types';

import AddressFromTo from 'src/slices/address/components/from-to/AddressFromTo';
import BlockWithTimestamp from 'src/slices/block/components/BlockWithTimestamp';
import TxEntity from 'src/slices/tx/components/entity/TxEntity';
import TxAdditionalInfo from 'src/slices/tx/components/TxAdditionalInfo';
import TxFee from 'src/slices/tx/components/TxFee';
import TxStatus from 'src/slices/tx/components/TxStatus';
import TxType from 'src/slices/tx/components/TxType';

import TxWatchListTags from 'src/features/account/components/TxWatchListTags';
import MetadataTag from 'src/features/address-metadata/components/tag/MetadataTag';

import config from 'src/config';
import NativeCoinValue from 'src/shared/values/entity/NativeCoinValue';

import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  tx: schemas['Transaction'];
  timestampNs?: string | null;
  isLoading?: boolean;
};

const LatestTxsItem = ({ tx, timestampNs, isLoading }: Props) => {
  const dataTo = tx.to ? tx.to : tx.created_contract;

  const protocolTag = tx.to?.metadata?.tags?.find(tag => tag.tagType === 'protocol');

  return (
    <Box
      width="100%"
      borderBottom="1px solid"
      borderColor="border.divider"
      py={ 4 }
      display={{ base: 'block', lg: 'none' }}
    >
      <Flex justifyContent="space-between">
        <HStack>
          <TxType types={ tx.transaction_types } isLoading={ isLoading }/>
          { tx.status !== 'ok' && <TxStatus status={ tx.status } errorText={ tx.status === 'error' ? tx.result : undefined } isLoading={ isLoading }/> }
          <TxWatchListTags tx={ tx } isLoading={ isLoading }/>
          { protocolTag && <MetadataTag data={ protocolTag } isLoading={ isLoading } minW="0" noColors/> }
        </HStack>
        <TxAdditionalInfo tx={ tx } isMobile isLoading={ isLoading }/>
      </Flex>
      <Flex
        mt={ 2 }
        alignItems="center"
        width="100%"
        justifyContent="space-between"
        mb={ 6 }
      >
        <TxEntity
          isLoading={ isLoading }
          hash={ tx.hash }
          fontWeight="700"
          truncation="constant_long"
        />
        { tx.block_number !== null && (
          <BlockWithTimestamp
            number={ tx.block_number }
            timestamp={ tx.timestamp }
            timestampNs={ timestampNs }
            isLoading={ isLoading }
            enableTimeIncrement
            timeFormat="relative"
            layout="horizontal"
          />
        ) }
      </Flex>
      <AddressFromTo
        from={ tx.from }
        to={ dataTo }
        isLoading={ isLoading }
        fontWeight="500"
      />
      { !(config.slices.tx.hiddenFields?.value && config.slices.tx.hiddenFields?.tx_fee) ? (
        <VStack rowGap={ 2 } mt={ 3 } alignItems="flex-start">
          { !config.slices.tx.hiddenFields?.value && (
            <Skeleton loading={ isLoading } w="fit-content">
              <Text as="span">Value </Text>
              <NativeCoinValue
                amount={ tx.value }
                accuracy={ 5 }
                loading={ isLoading }
                color="text.secondary"
              />
            </Skeleton>
          ) }
          { !config.slices.tx.hiddenFields?.tx_fee && (
            <Skeleton loading={ isLoading } w="fit-content" display="flex" whiteSpace="pre">
              <Text as="span">Fee </Text>
              <TxFee tx={ tx } accuracy={ 5 } color="text.secondary" noUsd/>
            </Skeleton>
          ) }
        </VStack>
      ) : null }
    </Box>
  );
};

export default React.memo(LatestTxsItem);
