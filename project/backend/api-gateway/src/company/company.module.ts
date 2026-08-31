import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [CompanyController],
  imports: [ProxyModule, ConfigModule],
})
export class CompanyModule {}
