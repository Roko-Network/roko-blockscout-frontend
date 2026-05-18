import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const DeveloperRpc = dynamic(() => import('ui/pages/DeveloperRpc'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/rpc">
      <DeveloperRpc/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
