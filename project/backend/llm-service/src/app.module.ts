import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmGatewayModule } from './llm/llm-gateway/llm-gateway.module';
import { LlmModule } from './llm/llm.module';
import { ReplyGuardService } from './llm/reply-guard/reply-guard.service';
import { rabbitMQModule } from './rabbitmq.module';

@Module({
  imports: [LlmGatewayModule, LlmModule, rabbitMQModule],
  controllers: [AppController],
  providers: [AppService, ReplyGuardService],
})
export class AppModule {}
