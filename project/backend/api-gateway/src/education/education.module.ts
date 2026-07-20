import { Module } from '@nestjs/common';
import { EducationController } from './education.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [EducationController],
})
export class EducationModule {}
