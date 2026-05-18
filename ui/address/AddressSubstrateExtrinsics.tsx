import { Box } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchAccountExtrinsics } from 'lib/api/services/general/substrateApi';
import { Skeleton } from 'toolkit/chakra/skeleton';
import SubstrateExtrinsicsTable from 'ui/substrate/SubstrateExtrinsicsTable';

interface Props {
  addressHash: string;
}

/**
 * Sprint 5 / S5-T13 — Substrate Calls tab on the address detail page.
 *
 * Mounts only when the address has ≥ 1 signed substrate extrinsic (the
 * mount decision happens upstream in Address.tsx using the same query
 * key for cache sharing).
 */
const AddressSubstrateExtrinsics = ({ addressHash }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'substrate_account_extrinsics', addressHash.toLowerCase() ],
    queryFn: () => fetchAccountExtrinsics(addressHash, 100),
    enabled: Boolean(addressHash),
  });

  if (isLoading) {
    return <Skeleton loading={ true } w="100%" h="120px"/>;
  }

  if (isError) {
    return <Box p={ 4 } color="red.500">Failed to load substrate extrinsics.</Box>;
  }

  return <SubstrateExtrinsicsTable items={ data?.items ?? [] }/>;
};

export default AddressSubstrateExtrinsics;
