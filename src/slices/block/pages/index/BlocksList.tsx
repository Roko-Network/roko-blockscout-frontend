// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box } from '@chakra-ui/react';
import React from 'react';

import type { schemas } from '@blockscout/api-types';
import type { ClusterChainConfig } from 'src/features/multichain/types/client';

import BlocksListItem from 'src/slices/block/pages/index/BlocksListItem';

import useTemporalBlockTimestamps from 'src/features/temporal/hooks/useTemporalBlockTimestamps';

import useInitialList from 'src/shared/lists/useInitialList';
import useLazyRenderedList from 'src/shared/lists/useLazyRenderedList';

interface Props {
  data: Array<schemas['Block']>;
  isLoading: boolean;
  page: number;
  chainData?: ClusterChainConfig;
  resetKey?: string;
  substrateCounts?: Record<string, number>;
}

const BlocksList = ({ data, isLoading, page, chainData, resetKey, substrateCounts }: Props) => {
  const initialList = useInitialList({
    data: data ?? [],
    idFn: (item) => item.height,
    enabled: !isLoading,
  });
  const { cutRef, renderedItemsNum } = useLazyRenderedList({ list: data, isEnabled: !isLoading, resetKey });
  const { data: temporalTimestamps } = useTemporalBlockTimestamps(data.map(item => item.height));

  return (
    <>
      <Box>
        { data.slice(0, renderedItemsNum).map((item, index) => (
          <BlocksListItem
            key={ item.height + (isLoading ? String(index) : '') }
            data={ item }
            isLoading={ isLoading }
            enableTimeIncrement={ page === 1 && !isLoading }
            animation={ initialList.getAnimationProp(item) }
            chainData={ chainData }
            substrateCount={ substrateCounts?.[String(item.height)] }
            timestampNs={ temporalTimestamps?.[String(item.height)] ?? null }
          />
        )) }
      </Box>
      <Box ref={ cutRef } h={ 0 }/>
    </>
  );
};

export default BlocksList;
