import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const TemporalValidatorDetail = dynamic(
  () => import('ui/pages/TemporalValidatorDetail'),
  { ssr: false },
);

const TemporalValidatorDetailWrapper = () => {
  const router = useRouter();
  const rawIndex = router.query.index;
  const index = rawIndex !== undefined ? parseInt(String(rawIndex), 10) : 0;
  const safeIndex = isNaN(index) ? 0 : index;

  return <TemporalValidatorDetail index={ safeIndex }/>;
};

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/temporal/validators/[index]">
      <TemporalValidatorDetailWrapper/>
    </PageNextJs>
  );
};

export default Page;

export { base as getServerSideProps } from 'nextjs/getServerSideProps/main';
