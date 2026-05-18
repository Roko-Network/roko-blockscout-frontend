import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const DeveloperRpc = dynamic(() => import('src/features/developer/pages/rpc/DeveloperRpc'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/rpc">
      <DeveloperRpc/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
