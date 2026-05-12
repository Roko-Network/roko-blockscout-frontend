import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const PwRoko = dynamic(() => import('ui/pages/PwRoko'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/pwroko">
      <PwRoko/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
