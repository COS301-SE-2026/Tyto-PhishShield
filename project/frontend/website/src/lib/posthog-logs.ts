import posthog from './posthog';
import type { Difficulty } from '../services/llm-template';

export const posthogLogs = {
  templateGenerationStarted(requestedCount: number, difficulty: Difficulty): void {
    posthog.logger.info('template_generation_started', {
      workflow: 'template_generation',
      requested_count: requestedCount,
      difficulty,
    });
  },

  templateGenerationCompleted(
    requestedCount: number,
    generatedCount: number,
    failedCount: number,
  ): void {
    posthog.logger.info('template_generation_completed', {
      workflow: 'template_generation',
      requested_count: requestedCount,
      generated_count: generatedCount,
      failed_count: failedCount,
    });
  },

  templateGenerationRejected(): void {
    posthog.logger.warn('template_generation_rejected', {
      workflow: 'template_generation',
    });
  },
};
