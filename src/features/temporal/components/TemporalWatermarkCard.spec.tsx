// @vitest-environment jsdom

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { describe, expect, it } from 'vitest';

import TemporalWatermarkCard from './TemporalWatermarkCard';

function renderCard() {
  return render(
    <ChakraProvider value={ defaultSystem }>
      <TemporalWatermarkCard
        isLoading={ false }
        data={{ watermark_ns: '0', watermark_datetime: '', block_number: 113 }}
      />
    </ChakraProvider>,
  );
}

describe('TemporalWatermarkCard', () => {
  it('distinguishes an unestablished transaction watermark from block time', () => {
    renderCard();

    expect(screen.getByText('Transaction Watermark')).toBeTruthy();
    expect(screen.getByText('Observed at block')).toBeTruthy();
    expect(screen.getByText('Not established')).toBeTruthy();
    expect(screen.getByText('Awaiting first stamped transaction')).toBeTruthy();
    expect(screen.getByText('No stamped transactions finalized')).toBeTruthy();
    expect(screen.queryByText(/1969|1970/)).toBeNull();
  });
});
