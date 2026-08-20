import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { ProxyService } from '../proxy/proxy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [LlmController],
  imports: [ProxyService, AuthModule]
})
export class LlmModule {}
