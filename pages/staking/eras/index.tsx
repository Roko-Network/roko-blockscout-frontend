import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const Eras = dynamic(() => import('ui/pages/Eras'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/staking/eras">
      <Eras/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
