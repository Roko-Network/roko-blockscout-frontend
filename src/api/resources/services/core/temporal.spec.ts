import buildUrl from 'src/api/utils/build-url';

import { describe, expect, test } from 'vitest';

import { CORE_API_TEMPORAL_RESOURCES } from './temporal';

describe('CORE_API_TEMPORAL_RESOURCES', () => {
  test('defines temporal_watermark resource with correct path', () => {
    expect(CORE_API_TEMPORAL_RESOURCES.temporal_watermark.path).toBe('/api/v2/temporal/watermark');
  });

  test('defines temporal_consensus_time resource with correct path', () => {
    expect(CORE_API_TEMPORAL_RESOURCES.temporal_consensus_time.path).toBe('/api/v2/temporal/consensus-time');
  });

  test('defines temporal_queue_stats resource with correct path', () => {
    expect(CORE_API_TEMPORAL_RESOURCES.temporal_queue_stats.path).toBe('/api/v2/temporal/queue-stats');
  });

  test('temporal resources do not have pathParams (no dynamic segments)', () => {
    expect('pathParams' in CORE_API_TEMPORAL_RESOURCES.temporal_watermark).toBe(false);
    expect('pathParams' in CORE_API_TEMPORAL_RESOURCES.temporal_consensus_time).toBe(false);
    expect('pathParams' in CORE_API_TEMPORAL_RESOURCES.temporal_queue_stats).toBe(false);
  });
});

describe('buildUrl with temporal resources', () => {
  test('builds URL for temporal_watermark', () => {
    const url = buildUrl('core:temporal_watermark');
    expect(url).toBe('https://localhost:3003/api/v2/temporal/watermark');
  });

  test('builds URL for temporal_consensus_time', () => {
    const url = buildUrl('core:temporal_consensus_time');
    expect(url).toBe('https://localhost:3003/api/v2/temporal/consensus-time');
  });

  test('builds URL for temporal_queue_stats', () => {
    const url = buildUrl('core:temporal_queue_stats');
    expect(url).toBe('https://localhost:3003/api/v2/temporal/queue-stats');
  });
});
