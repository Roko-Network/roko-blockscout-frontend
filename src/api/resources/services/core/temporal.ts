import type { ApiResource } from '../../types';
import type { TemporalConsensusTime, TemporalQueueStats, TemporalWatermark } from 'src/features/temporal/types/api';

export const CORE_API_TEMPORAL_RESOURCES = {
  temporal_watermark: {
    path: '/api/v2/temporal/watermark',
  },
  temporal_consensus_time: {
    path: '/api/v2/temporal/consensus-time',
  },
  temporal_queue_stats: {
    path: '/api/v2/temporal/queue-stats',
  },
} satisfies Record<string, ApiResource>;

export type CoreApiTemporalResourceName = `core:${ keyof typeof CORE_API_TEMPORAL_RESOURCES }`;

/* eslint-disable @stylistic/indent */
export type CoreApiTemporalResourcePayload<R extends CoreApiTemporalResourceName> =
R extends 'core:temporal_watermark' ? TemporalWatermark :
R extends 'core:temporal_consensus_time' ? TemporalConsensusTime :
R extends 'core:temporal_queue_stats' ? TemporalQueueStats :
never;
/* eslint-enable @stylistic/indent */
