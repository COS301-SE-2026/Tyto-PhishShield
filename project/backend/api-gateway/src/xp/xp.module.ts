import { Module } from '@nestjs/common';
import { XpController } from './xp.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [XpController],
})
export class XpModule {}
