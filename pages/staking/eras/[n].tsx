import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import type { Props } from 'nextjs/getServerSideProps/handlers';
import PageNextJs from 'nextjs/PageNextJs';

const Era = dynamic(() => import('ui/pages/Era'), { ssr: false });

const Page: NextPage<Props<'/staking/eras/[n]'>> = (props) => {
  return (
    <PageNextJs pathname="/staking/eras/[n]" query={ props.query }>
      <Era/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
