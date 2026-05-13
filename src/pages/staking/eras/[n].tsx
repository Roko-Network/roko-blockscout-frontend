import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import type { Props } from 'src/server/getServerSideProps/handlers';
import PageNextJs from 'src/server/PageNextJs';

const Era = dynamic(() => import('src/features/substrate/pages/era/Era'), { ssr: false });

const Page: NextPage<Props<'/staking/eras/[n]'>> = (props) => {
  return (
    <PageNextJs pathname="/staking/eras/[n]" query={ props.query }>
      <Era/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'src/server/getServerSideProps/main';
