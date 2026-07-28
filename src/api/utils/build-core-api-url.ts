// SPDX-License-Identifier: LicenseRef-Blockscout

import config from 'src/config';

export default function buildCoreApiUrl(path: string): string {
  const api = config.apis.core;
  if (!api) {
    return path;
  }

  return new URL(`${ api.basePath ?? '' }${ path }`, api.endpoint).toString();
}
