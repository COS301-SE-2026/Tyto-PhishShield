import { Module } from '@nestjs/common';
import { CommsController } from './comms.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [CommsController],
})
export class CommsModule {}