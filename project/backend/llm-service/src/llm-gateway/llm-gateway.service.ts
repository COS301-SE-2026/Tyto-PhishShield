import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatDto,
  ErrorLlmGatewayResponse,
  LlmGatewayRequestBody,
  OkLlmGatewayResponse,
} from '../dto/llm-gateway.dto';

@Injectable()
export class LlmGatewayService {
  private readonly llmGatewayUrl: string;
  private readonly llmGatewayKey: string;

  constructor(private readonly config: ConfigService) {
    this.llmGatewayKey = config.getOrThrow<string>('LLM_GATEWAY_KEY');
    this.llmGatewayUrl = config.getOrThrow<string>('LLM_GATEWAY_URL');
  }

  async basicChat(chat: ChatDto): Promise<OkLlmGatewayResponse> {
    const body: LlmGatewayRequestBody = { ...chat, n: 1 };
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
      throw error;
    }

    const data: OkLlmGatewayResponse =
      (await response.json()) as OkLlmGatewayResponse;
    return data;
  }
}
