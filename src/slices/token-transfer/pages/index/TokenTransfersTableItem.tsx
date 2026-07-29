// SPDX-License-Identifier: LicenseRef-Blockscout

import React from 'react';

import type { schemas } from '@blockscout/api-types';
import type { ClusterChainConfig } from 'src/features/multichain/types/client';
import { isConfidentialTokenType, NFT_TOKEN_TYPE_IDS } from 'src/slices/token/utils/token-types';

import AddressFromTo from 'src/slices/address/components/from-to/AddressFromTo';
import BlockWithTimestamp from 'src/slices/block/components/BlockWithTimestamp';
import NftEntity from 'src/slices/token/components/entity/NftEntity';
import TxEntity from 'src/slices/tx/components/entity/TxEntity';

import ChainIcon from 'src/shared/external-chains/ChainIcon';
import ConfidentialTokenValue from 'src/shared/values/entity/ConfidentialTokenValue';
import TokenValue from 'src/shared/values/entity/TokenValue';

import { Badge } from 'src/toolkit/chakra/badge';
import { Skeleton } from 'src/toolkit/chakra/skeleton';
import { TableCell, TableRow } from 'src/toolkit/chakra/table';

type Props = {
  item: schemas['TokenTransfer'];
  isLoading?: boolean;
  chainData?: ClusterChainConfig;
  timestampNs?: string | null;
};

const TokenTransferTableItem = ({ item, isLoading, chainData, timestampNs }: Props) => {
  const isConfidential = item.token ? isConfidentialTokenType(item.token.type) : false;

  const renderValue = () => {
    if (item.token && item.total && 'value' in item.total && item.total.value !== null) {
      return (
        <TokenValue
          amount={ item.total.value }
          token={ item.token }
          decimals={ item.total.decimals || '0' }
          layout="vertical"
          loading={ isLoading }
        />
      );
    }

    if (isConfidential && item.token) {
      return (
        <ConfidentialTokenValue
          token={ item.token }
          loading={ isLoading }
        />
      );
    }

    return <Skeleton loading={ isLoading }>-</Skeleton>;
  };

  return (
    <TableRow>
      { chainData && (
        <TableCell>
          <ChainIcon data={ chainData } isLoading={ isLoading }/>
        </TableCell>
      ) }
      <TableCell>
        { item.transaction_hash ? (
          <TxEntity
            hash={ item.transaction_hash }
            isLoading={ isLoading }
            fontWeight={ 600 }
            noIcon
            truncation="constant_long"
          />
        ) : (
          <Skeleton loading={ isLoading }>-</Skeleton>
        ) }
      </TableCell>
      <TableCell maxW="120px">
        { item.method && <Badge loading={ isLoading }>{ item.method }</Badge> }
      </TableCell>
      <TableCell>
        <BlockWithTimestamp
          number={ item.block_number }
          timestamp={ item.timestamp }
          timestampNs={ timestampNs }
          txHash={ item.transaction_hash }
          isLoading={ isLoading }
          enableTimeIncrement
        />
      </TableCell>
      <TableCell>
        <AddressFromTo
          maxW={{ lg: '220px', xl: '320px' }}
          from={ item.from }
          to={ item.to }
          isLoading={ isLoading }
          mode={{ lg: 'compact', xl: 'long' }}
        />
      </TableCell>
      <TableCell>
        { item.total && 'token_id' in item.total && item.token && item.token.type &&
          (NFT_TOKEN_TYPE_IDS.includes(item.token.type)) && item.total.token_id !== null ? (
            <NftEntity
              hash={ item.token.address_hash }
              id={ item.total.token_id }
              instance={ item.total.token_instance }
              isLoading={ isLoading }
              maxW="140px"
            />
          ) : <Skeleton loading={ isLoading }>-</Skeleton> }
      </TableCell>
      <TableCell isNumeric verticalAlign="top">
        { renderValue() }
      </TableCell>
    </TableRow>
  );
};

export default React.memo(TokenTransferTableItem);
