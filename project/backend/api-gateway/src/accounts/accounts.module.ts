/**
 * AccountsModule — exposes account-related proxy endpoints.
 *
 * - Forwards account management requests to the accounts microservice via the proxy.
 */
import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [AccountsController],
})
export class AccountsModule {}
