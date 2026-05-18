import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const DeveloperMetadata = dynamic(() => import('ui/pages/DeveloperMetadata'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/metadata">
      <DeveloperMetadata/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
