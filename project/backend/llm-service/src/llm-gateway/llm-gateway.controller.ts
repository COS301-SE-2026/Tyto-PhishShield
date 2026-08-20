import { Body, Controller, Post } from '@nestjs/common';
import { LlmGatewayService } from './llm-gateway.service';
import type { ChatDto } from '../dto/llm-gateway.dto';

@Controller('llm-gateway')
export class LlmGatewayController {
  constructor(private readonly llmGatewayService: LlmGatewayService) {}

  @Post('chat')
  chat(@Body() request: ChatDto) {
    return this.llmGatewayService.basicChat(request);
  }
}
