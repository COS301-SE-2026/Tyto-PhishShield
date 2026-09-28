/**
 * Service: llm-service
 *
 * LLM-Gateway:
 * Proxies requests to an external LLM-Gateway which manages which LLMs are used and applies rate limiting,
 * and to a local Ollama instance for on-device model inference.
 *
 * Requires:
 * env variables:
 * LLM_GATEWAY_KEY
 * LLM_GATEWAY_URL
 * LOCAL_LLM_URL
 *
 * Functions:
 * - {@link LlmGatewayService#send} - Sends a fully-formed chat completion request to the LLM gateway and returns the parsed response.
 * - {@link LlmGatewayService#sendLocal} - Sends a chat completion request to the local Ollama instance and returns the raw message content.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ErrorLlmGatewayResponse,
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from '../dto/llm-gateway.dto';
import { Ollama } from 'ollama';

export interface LocalLlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LocalLlmRequest {
  model: string;
  messages: LocalLlmChatMessage[];
  format?: 'json';
  temperature?: number;
}

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);
  private readonly llmGatewayUrl: string;
  private readonly llmGatewayKey: string;
  private readonly localLlmUrl: string;
  private readonly ollama: Ollama;

  constructor(private readonly config: ConfigService) {
    this.llmGatewayKey = config.getOrThrow<string>('LLM_GATEWAY_KEY');
    this.llmGatewayUrl = config.getOrThrow<string>('LLM_GATEWAY_URL');
    this.localLlmUrl = config.getOrThrow<string>('LOCAL_LLM_URL');
    this.ollama = new Ollama({ host: this.localLlmUrl });
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

  async sendLocal(request: LocalLlmRequest): Promise<string> {
    try {
      const response = await this.ollama.chat({
        model: request.model,
        messages: request.messages,
        stream: false,
        format: request.format,
        options: {
          temperature: request.temperature ?? 0,
        },
      });

      return response.message.content;
    } catch (err) {
      this.logger.error(`Local LLM request failed against ${this.localLlmUrl}`);
      this.logger.error(`Error name: ${(err as Error)?.name}`);
      this.logger.error(`Error message: ${(err as Error)?.message}`);

      throw err;
    }
  }
}
