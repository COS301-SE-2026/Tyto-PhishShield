import posthog from './posthog';

interface AiGenerationCapture {
  spanName: string;
  input: unknown;
  output: unknown;
  latencyMs: number;
}

function createTraceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function captureAiGeneration({
  spanName,
  input,
  output,
  latencyMs,
}: AiGenerationCapture): void {
  posthog.capture('$ai_generation', {
    $ai_trace_id: createTraceId(),
    $ai_session_id: null,
    $ai_span_name: spanName,
    $ai_provider: 'custom',
    $ai_model: 'backend-managed',
    $ai_input: [{ role: 'user', content: JSON.stringify(input) }],
    $ai_output_choices: [{ role: 'assistant', content: JSON.stringify(output) }],
    $ai_latency: latencyMs / 1000,
  });
}
