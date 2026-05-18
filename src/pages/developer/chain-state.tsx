import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const DeveloperChainState = dynamic(() => import('src/features/developer/pages/chain-state/DeveloperChainState'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/chain-state">
      <DeveloperChainState/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
