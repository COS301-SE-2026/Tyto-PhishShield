import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmGatewayModule } from './llm-gateway/llm-gateway.module';

@Module({
  imports: [LlmGatewayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
