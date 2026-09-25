import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { LlmGatewayModule } from './llm-gateway/llm-gateway.module';
import { ConfigModule } from '@nestjs/config';
import { ClassificationService } from './classification/classification.service';
import { ReplyGuardService } from './reply-guard/reply-guard.service';
import { ReceivedEmailService } from './received-email/received-email.service';
import { rabbitMQModule } from '../rabbitmq.module';
import { ReplyGenerationService } from './reply-generation/reply-generation.service';

@Module({
  imports: [LlmGatewayModule, ConfigModule, rabbitMQModule],
  controllers: [LlmController],
  providers: [
    LlmService,
    PromptBuilderService,
    ClassificationService,
    ReplyGuardService,
    ReceivedEmailService,
    ReplyGenerationService,
  ],
})
export class LlmModule {}
