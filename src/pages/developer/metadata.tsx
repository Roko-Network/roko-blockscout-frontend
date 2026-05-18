import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const DeveloperMetadata = dynamic(() => import('src/features/developer/pages/metadata/DeveloperMetadata'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer/metadata">
      <DeveloperMetadata/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
