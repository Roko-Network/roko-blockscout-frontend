import React from 'react';

import * as statsMock from 'src/slices/chain/stats/mocks';
import * as txsStatsMock from 'src/slices/tx/mocks/stats';

import { test, expect } from 'playwright/lib';

import TxsStats from './TxsStats';

test('base view +@mobile', async({ render, mockApiResponse, mockEnvs, page }) => {
  await page.route('https://index.roko.network/static/transactions/summary.json', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({
      schemaVersion: 1, chainId: 52370, complete: true, windowSeconds: 86400,
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      counts: { evm: 992890, nativeSigned: 0, total: 992890 },
    }),
  }));
  await mockEnvs([ [ 'NEXT_PUBLIC_STATS_API_HOST', '' ] ]);
  await mockApiResponse('core:stats', statsMock.base);
  await mockApiResponse('core:txs_stats', txsStatsMock.base);
  const component = await render(<TxsStats/>);
  await expect(component).toHaveScreenshot();
});
