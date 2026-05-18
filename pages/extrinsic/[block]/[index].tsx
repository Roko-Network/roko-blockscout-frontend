import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import type { Props } from 'nextjs/getServerSideProps/handlers';
import PageNextJs from 'nextjs/PageNextJs';

const Extrinsic = dynamic(() => import('ui/pages/Extrinsic'), { ssr: false });

const Page: NextPage<Props<'/extrinsic/[block]/[index]'>> = (props) => {
  return (
    <PageNextJs pathname="/extrinsic/[block]/[index]" query={ props.query }>
      <Extrinsic/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
