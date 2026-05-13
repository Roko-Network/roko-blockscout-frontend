import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

import config from 'configs/app';

const validatorsFeature = config.features.validators;

const Validators = dynamic(() => {
  if (validatorsFeature.isEnabled && validatorsFeature.chainType === 'stability') {
    return import('ui/pages/ValidatorsStability');
  }

  if (validatorsFeature.isEnabled && validatorsFeature.chainType === 'blackfort') {
    return import('ui/pages/ValidatorsBlackfort');
  }

  if (validatorsFeature.isEnabled && validatorsFeature.chainType === 'zilliqa') {
    return import('ui/pages/ValidatorsZilliqa');
  }

  // Roko default: the substrate-native validator list backed by
  // `/api/v2/substrate/validators` (Sprint 4 / S4-T1). This is the fork's
  // own validator surface — it doesn't share the Blockscout chainType flag
  // because the data comes from our indexer, not a Blockscout-supported
  // chain-specific contract API.
  return import('ui/pages/ValidatorsRoko');
}, { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/validators">
      <Validators/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
