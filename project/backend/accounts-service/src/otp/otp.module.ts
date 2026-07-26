import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifiedDevice } from './otp.entity';
import { OtpService } from './otp.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([VerifiedDevice]), UsersModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
