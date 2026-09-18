import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('auth/device')
export class DeviceController {
  constructor(readonly deviceService: DeviceService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  verifyDevice(@Body() device: { email: string; deviceToken: string }) {
    return this.deviceService.verifyDevice(device.email, device.deviceToken);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  generateDevice(
    @Body() device: { email: string; userAgent: string; ipCreated: string },
  ) {
    return this.deviceService.generateDeviceToken(
      device.email,
      device.userAgent,
      device.ipCreated,
    );
  }
}
