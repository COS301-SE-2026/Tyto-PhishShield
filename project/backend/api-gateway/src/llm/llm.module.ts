import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { AuthModule } from '../auth/auth.module';
import { ProxyModule } from '../proxy/proxy.module';
import { LlmService } from './llm.service';

@Module({
  controllers: [LlmController],
  imports: [ProxyModule, AuthModule],
  providers: [LlmService],
})
export class LlmModule {}
