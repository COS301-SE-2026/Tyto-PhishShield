import { Module } from '@nestjs/common';
import { LlmGatewayService } from './llm-gateway.service';
import { LlmGatewayController } from './llm-gateway.controller';

@Module({
  controllers: [LlmGatewayController],
  providers: [LlmGatewayService],
  exports: [LlmGatewayService],
})
export class LlmGatewayModule {}
