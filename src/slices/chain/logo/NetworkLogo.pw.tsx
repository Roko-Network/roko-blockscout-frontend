import React from 'react';

import { test, expect } from 'playwright/lib';

import NetworkLogo from './NetworkLogo';

test.use({ viewport: { width: 220, height: 60 } });

test('uses the bundled ROKO lockup +@dark-mode', async({ render }) => {
  const component = await render(<NetworkLogo/>);
  const image = component.locator('img');

  await expect(image).toHaveAttribute('src', '/roko-logo.png');
  await expect(image).toHaveAttribute('alt', 'Roko Network logo');
  await expect(image).toHaveCSS('width', '36px');
  await expect(image).toHaveCSS('height', '36px');
  await expect(component.getByText('Roko Network')).toBeVisible();
});
