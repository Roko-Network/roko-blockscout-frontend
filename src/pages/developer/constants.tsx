import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const DeveloperConstants = dynamic(() => import('src/features/developer/pages/constants/DeveloperConstants'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/constants">
      <DeveloperConstants/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
