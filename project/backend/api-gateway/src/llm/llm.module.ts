import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { AuthModule } from '../auth/auth.module';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  controllers: [LlmController],
  imports: [ProxyModule, AuthModule],
})
export class LlmModule {}
