import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const DeveloperChainState = dynamic(() => import('ui/pages/DeveloperChainState'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/chain-state">
      <DeveloperChainState/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
