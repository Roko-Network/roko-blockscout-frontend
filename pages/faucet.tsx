import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const Faucet = dynamic(() => import('ui/pages/Faucet'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/faucet">
      <Faucet/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
