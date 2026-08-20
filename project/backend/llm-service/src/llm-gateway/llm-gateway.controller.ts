import { Controller } from '@nestjs/common';
import { LlmGatewayService } from './llm-gateway.service';

@Controller('llm-gateway')
export class LlmGatewayController {
  constructor(private readonly llmGatewayService: LlmGatewayService) {}

  
}
