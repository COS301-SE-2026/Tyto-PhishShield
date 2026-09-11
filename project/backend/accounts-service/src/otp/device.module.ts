import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerifiedDevice } from './device.entity';
import { DeviceService } from './device.service';
import { AuthModule } from '../auth/auth.module';
import { DeviceController } from './device.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerifiedDevice]),
    forwardRef(() => AuthModule),
  ],
  providers: [DeviceService],
  controllers: [DeviceController],
  exports: [DeviceService],
})
export class OtpModule {}
