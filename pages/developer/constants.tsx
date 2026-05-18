import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const DeveloperConstants = dynamic(() => import('ui/pages/DeveloperConstants'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/constants">
      <DeveloperConstants/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
