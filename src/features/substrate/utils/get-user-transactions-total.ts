// SPDX-License-Identifier: LicenseRef-Blockscout

export default function getUserTransactionsTotal(
  evmTotal: string | number | undefined,
  nativeSignedTotal: number | undefined,
): number | undefined {
  if (evmTotal === undefined) {
    return undefined;
  }

  return Number(evmTotal) + (nativeSignedTotal ?? 0);
}
