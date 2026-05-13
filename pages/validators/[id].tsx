import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import type { Props } from 'nextjs/getServerSideProps/handlers';
import PageNextJs from 'nextjs/PageNextJs';

import config from 'configs/app';

const validatorsFeature = config.features.validators;

const ValidatorDetails = dynamic(() => {
  if (validatorsFeature.isEnabled && validatorsFeature.chainType === 'zilliqa') {
    return import('ui/pages/ValidatorZilliqa');
  }

  // Roko default (S4-T1): substrate-native validator detail page. The
  // component reads the stash from the [id] route param via useRouter.
  return import('ui/pages/ValidatorRoko');
}, { ssr: false });

const Page: NextPage<Props> = (props) => {
  return (
    <PageNextJs pathname="/validators/[id]" query={ props.query }>
      <ValidatorDetails/>
    </PageNextJs>
  );
};

export default Page;

// The Roko default doesn't need the chain-type guard; fall through to base.
export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
