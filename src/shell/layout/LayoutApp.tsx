// SPDX-License-Identifier: LicenseRef-Blockscout

import React from 'react';

import type { Props } from './types';

import HeaderMobile from 'src/shell/header/HeaderMobile';

import AppErrorBoundary from 'src/shared/errors/AppErrorBoundary';

import * as Layout from './components';

const HEADER_HEIGHT_MOBILE = 56;

const LayoutApp = ({ children }: Props) => {
  return (
    <Layout.Root content={ children }>
      <Layout.Container
        overflowY="hidden"
        height="$100vh"
        display="flex"
        flexDirection="column"
      >
        <HeaderMobile/>
        <Layout.MainArea
          minH={{
            base: `calc(100dvh - ${ HEADER_HEIGHT_MOBILE }px)`,
            lg: '100dvh',
          }}
          flex={ 1 }
        >
          <Layout.MainColumn
            paddingTop={{ base: 0, lg: 0 }}
            paddingBottom={ 0 }
            paddingX={{ base: 4, lg: 6 }}
          >
            <AppErrorBoundary>
              <Layout.Content pt={{ base: 0, lg: 2 }} flexGrow={ 1 }>
                { children }
              </Layout.Content>
            </AppErrorBoundary>
          </Layout.MainColumn>
        </Layout.MainArea>
      </Layout.Container>
    </Layout.Root>
  );
};

export default LayoutApp;
