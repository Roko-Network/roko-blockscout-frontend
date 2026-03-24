import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const Temporal = dynamic(() => import('ui/pages/Temporal'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/temporal">
      <Temporal/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
