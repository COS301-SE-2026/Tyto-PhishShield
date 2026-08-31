import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [ProxyModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
