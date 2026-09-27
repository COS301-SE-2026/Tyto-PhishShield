import { Module } from '@nestjs/common';
import { XpController } from './xp.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';
import { ReviewController } from './review/review.controller';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [XpController, ReviewController],
})
export class XpModule {}
