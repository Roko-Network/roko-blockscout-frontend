import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const PwRoko = dynamic(() => import('src/features/pwroko/pages/index/PwRoko'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/pwroko">
      <PwRoko/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
