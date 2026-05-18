import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import type { Props } from 'src/server/getServerSideProps/handlers';
import PageNextJs from 'src/server/PageNextJs';

const Extrinsic = dynamic(() => import('src/features/substrate/pages/extrinsic/Extrinsic'), { ssr: false });

const Page: NextPage<Props<'/extrinsic/[block]/[index]'>> = (props) => {
  return (
    <PageNextJs pathname="/extrinsic/[block]/[index]" query={ props.query }>
      <Extrinsic/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
