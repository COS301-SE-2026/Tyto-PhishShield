import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifiedDevice } from './otp.entity';
import { OtpService } from './otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([VerifiedDevice])],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
