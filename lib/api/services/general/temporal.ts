import type { ApiResource } from '../../types';
import type { TemporalConsensusTime, TemporalQueueStats, TemporalWatermark } from 'types/api/temporal';

export const GENERAL_API_TEMPORAL_RESOURCES = {
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

export type GeneralApiTemporalResourceName = `general:${ keyof typeof GENERAL_API_TEMPORAL_RESOURCES }`;

/* eslint-disable @stylistic/indent */
export type GeneralApiTemporalResourcePayload<R extends GeneralApiTemporalResourceName> =
R extends 'general:temporal_watermark' ? TemporalWatermark :
R extends 'general:temporal_consensus_time' ? TemporalConsensusTime :
R extends 'general:temporal_queue_stats' ? TemporalQueueStats :
never;
/* eslint-enable @stylistic/indent */
