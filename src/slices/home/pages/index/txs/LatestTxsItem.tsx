// SPDX-License-Identifier: LicenseRef-Blockscout

import {
  Box,
  Flex,
  HStack,
  Text,
  Grid,
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
  const columnNum = config.slices.tx.hiddenFields?.value && config.slices.tx.hiddenFields?.tx_fee ? 2 : 3;

  const protocolTag = tx.to?.metadata?.tags?.find(tag => tag.tagType === 'protocol');

  const tagsCount = [
    1, // tx type
    1, // tx status
    ...(tx.from?.watchlist_names || []),
    ...(tx.to?.watchlist_names || []),
    protocolTag,
  ].filter(Boolean).length;

  return (
    <Grid
      gridTemplateColumns={{
        lg: columnNum === 2 ? '3fr minmax(auto, 200px)' : '3fr minmax(auto, 200px) 170px',
        xl: columnNum === 2 ? '3fr minmax(auto, 270px)' : '3fr minmax(auto, 300px) 170px',
      }}
      gridGap={ 3 }
      width="100%"
      minW={ columnNum === 2 ? '700px' : '750px' }
      borderBottom="1px solid"
      borderColor="border.divider"
      p={ 4 }
      display={{ base: 'none', lg: 'grid' }}
    >
      <Flex overflow="hidden" w="100%">
        <TxAdditionalInfo tx={ tx } isLoading={ isLoading } my="3px"/>
        <Box ml={ 3 } w="calc(100% - 40px)">
          <HStack flexWrap={ tagsCount <= 3 ? 'nowrap' : 'wrap' } my="3px">
            <TxType types={ tx.transaction_types } isLoading={ isLoading }/>
            { tx.status !== 'ok' && <TxStatus status={ tx.status } errorText={ tx.status === 'error' ? tx.result : undefined } isLoading={ isLoading }/> }
            <TxWatchListTags tx={ tx } isLoading={ isLoading }/>
            { protocolTag && <MetadataTag data={ protocolTag } isLoading={ isLoading } minW="0" noColors/> }
          </HStack>
          <Flex
            alignItems="center"
            mt="7px"
            mb="3px"
            columnGap={ 3 }
          >
            <TxEntity
              isLoading={ isLoading }
              hash={ tx.hash }
              fontWeight="700"
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
        </Box>
      </Flex>
      <AddressFromTo
        from={ tx.from }
        to={ dataTo }
        isLoading={ isLoading }
        mode="compact"
      />
      { !(config.slices.tx.hiddenFields?.value && config.slices.tx.hiddenFields?.tx_fee) ? (
        <Flex flexDir="column" rowGap={ 3 }>
          { !config.slices.tx.hiddenFields?.value && (
            <Skeleton loading={ isLoading }>
              <Text as="span" whiteSpace="pre">Value </Text>
              <NativeCoinValue
                amount={ tx.value }
                accuracy={ 5 }
                loading={ isLoading }
                color="text.secondary"
              />
            </Skeleton>
          ) }
          { !config.slices.tx.hiddenFields?.tx_fee && (
            <Skeleton loading={ isLoading } display="flex" whiteSpace="pre">
              <Text as="span">Fee </Text>
              <TxFee tx={ tx } accuracy={ 5 } color="text.secondary" noUsd/>
            </Skeleton>
          ) }
        </Flex>
      ) : null }
    </Grid>
  );
};

export default React.memo(LatestTxsItem);
