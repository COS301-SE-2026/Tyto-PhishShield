/**
 * AccountsModule — exposes account-related proxy endpoints.
 *
 * - Forwards account management requests to the accounts microservice via the proxy.
 */
import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';
import { AccountsService } from './accounts.service';
import { HttpModule } from '@nestjs/axios';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [ProxyModule, AuthModule, HttpModule, OtpModule],
  controllers: [AccountsController],
  providers: [AccountsService]
})
export class AccountsModule {}
