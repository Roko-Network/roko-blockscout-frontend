import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const Eras = dynamic(() => import('src/features/substrate/pages/eras/Eras'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/staking/eras">
      <Eras/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
