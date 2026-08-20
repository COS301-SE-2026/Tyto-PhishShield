import { Module } from '@nestjs/common';
import { LlmGatewayService } from './llm-gateway.service';
import { LlmGatewayController } from './llm-gateway.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [LlmGatewayController],
  providers: [LlmGatewayService],
  imports: [ConfigModule],
  exports: [LlmGatewayService],
})
export class LlmGatewayModule {}
