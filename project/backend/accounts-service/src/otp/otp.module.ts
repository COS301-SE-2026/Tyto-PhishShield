import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifiedDevice } from './otp.entity';
import { OtpService } from './otp.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerifiedDevice]),
    forwardRef(() => AuthModule),
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
