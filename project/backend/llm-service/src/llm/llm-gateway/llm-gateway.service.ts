/**
 * Service: llm-service
 *
 * LLM-Gateway:
 * Proxies requests to an external LLM-Gateway which manages which LLMs are used and applies rate limiting.
 *
 * Requires:
 * env variables:
 * LLM_GATEWAY_KEY
 * LLM_GATEWAY_URL
 *
 * Functions:
 * - {@link LlmGatewayService#send} - Sends a fully-formed chat completion request to the LLM gateway and returns the parsed response.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ErrorLlmGatewayResponse,
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from '../dto/llm-gateway.dto';

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);
  private readonly llmGatewayUrl: string;
  private readonly llmGatewayKey: string;

  constructor(private readonly config: ConfigService) {
    this.llmGatewayKey = config.getOrThrow<string>('LLM_GATEWAY_KEY');
    this.llmGatewayUrl = config.getOrThrow<string>('LLM_GATEWAY_URL');
  }

  async send(body: LlmGatewayRequestBody): Promise<OkLlmGatewayResponse> {
    const response = await fetch(`${this.llmGatewayUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.llmGatewayKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorLlmGatewayResponse;
      this.logger.warn(
        `LLM gateway request failed: ${error.error?.message ?? response.statusText}`,
      );
      throw error;
    }

    return (await response.json()) as OkLlmGatewayResponse;
  }
}
