import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const DeveloperConsole = dynamic(() => import('ui/pages/DeveloperConsole'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/developer">
      <DeveloperConsole/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
