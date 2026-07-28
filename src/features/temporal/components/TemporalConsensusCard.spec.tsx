// @vitest-environment jsdom

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { TEMPORAL_CONSENSUS_TIME } from 'src/features/temporal/stubs';

import { describe, expect, it } from 'vitest';

import TemporalConsensusCard from './TemporalConsensusCard';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={ defaultSystem }>
      { children }
    </ChakraProvider>
  );
}

describe('TemporalConsensusCard', () => {
  it('labels connected participants as mesh nodes, not validators', () => {
    render(
      <TemporalConsensusCard data={ TEMPORAL_CONSENSUS_TIME } isLoading={ false }/>,
      { wrapper },
    );

    expect(screen.getAllByText('3 nodes in mesh').length).toBeGreaterThan(0);
    expect(screen.queryByText(/validators? in mesh/i)).toBeNull();
  });
});
