import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const TemporalMesh = dynamic(() => import('ui/pages/TemporalMesh'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/temporal/mesh">
      <TemporalMesh/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
