import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const DeveloperConsole = dynamic(() => import('src/features/developer/pages/index/DeveloperConsole'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer">
      <DeveloperConsole/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
