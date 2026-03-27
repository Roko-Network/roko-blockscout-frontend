import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const TemporalMesh = dynamic(() => import('src/features/temporal/pages/mesh/TemporalMesh'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/temporal/mesh">
      <TemporalMesh/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
