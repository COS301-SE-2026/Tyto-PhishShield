/**
 * MailingModule — groups mailing-related controllers and providers.
 *
 * - Exposes endpoints to create and manage email campaigns and sends.
 */
import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';
import { MailingController } from './mailing.controller';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [MailingController],
})
export class MailingModule {}
