import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { LlmGatewayModule } from './llm-gateway/llm-gateway.module';

@Module({
  imports: [LlmGatewayModule],
  controllers: [LlmController],
  providers: [LlmService, PromptBuilderService],
})
export class LlmModule {}
