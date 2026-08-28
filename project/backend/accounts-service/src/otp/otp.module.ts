import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifiedDevice } from './otp.entity';
import { OtpService } from './otp.service';
import { AuthModule } from '../auth/auth.module';
import { DeviceController } from './device.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerifiedDevice]),
    forwardRef(() => AuthModule),
  ],
  providers: [OtpService],
  controllers: [DeviceController],
  exports: [OtpService],
})
export class OtpModule {}
