import React from 'react';

import { test, expect } from 'playwright/lib';

import NetworkIcon from './NetworkIcon';

test.use({ viewport: { width: 48, height: 48 } });

test('uses the bundled ROKO icon +@dark-mode', async({ render }) => {
  const component = await render(<NetworkIcon/>);
  const image = component.locator('img');

  await expect(image).toHaveAttribute('src', '/roko-logo.png');
  await expect(image).toHaveAttribute('alt', 'Roko Network icon');
  await expect(image).toHaveCSS('width', '36px');
  await expect(image).toHaveCSS('height', '36px');
});
