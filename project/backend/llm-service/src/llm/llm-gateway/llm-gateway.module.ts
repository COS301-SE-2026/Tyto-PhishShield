import { Module } from '@nestjs/common';
import { LlmGatewayService } from './llm-gateway.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [LlmGatewayService],
  imports: [ConfigModule],
  exports: [LlmGatewayService],
})
export class LlmGatewayModule {}
