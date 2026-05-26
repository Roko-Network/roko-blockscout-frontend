import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'src/server/PageNextJs';

const Extrinsics = dynamic(() => import('src/features/substrate/pages/extrinsics/Extrinsics'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/extrinsics">
      <Extrinsics/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
