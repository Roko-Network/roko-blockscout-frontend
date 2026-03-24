import { describe, expect, test } from 'vitest';

import buildUrl from 'src/api/utils/build-url';

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
    expect(CORE_API_TEMPORAL_RESOURCES.temporal_watermark.pathParams).toBeUndefined();
    expect(CORE_API_TEMPORAL_RESOURCES.temporal_consensus_time.pathParams).toBeUndefined();
    expect(CORE_API_TEMPORAL_RESOURCES.temporal_queue_stats.pathParams).toBeUndefined();
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
