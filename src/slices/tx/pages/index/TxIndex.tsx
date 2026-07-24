// SPDX-License-Identifier: LicenseRef-Blockscout

import { Text } from '@chakra-ui/react';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import useIsMobile from 'src/shared/hooks/useIsMobile';

import TxsTabs from './list/TxsTabs';
import TxsStats from './stats/TxsStats';

const TAB_LIST_PROPS = {
  marginBottom: 0,
  pt: 6,
  pb: 6,
  marginTop: -5,
};
const TABS_HEIGHT = 88;

const Transactions = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <PageTitle title="Transactions" withTextAd/>
      <Text fontSize="xs" color="text.secondary" mb={ 2 }>EVM activity statistics</Text>
      <TxsStats/>
      <TxsTabs
        includeSubstrateUserTxs
        listProps={ isMobile ? undefined : TAB_LIST_PROPS }
        tabsHeight={ TABS_HEIGHT }
      />
    </>
  );
};

export default Transactions;
