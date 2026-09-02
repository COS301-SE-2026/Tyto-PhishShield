import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmGatewayModule } from './llm/llm-gateway/llm-gateway.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [LlmGatewayModule, LlmModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
