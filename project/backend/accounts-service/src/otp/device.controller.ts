import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";


@Controller('auth/device')
export class DeviceController {
    constructor(readonly otpService: OtpService) {}

    @Post('verify')
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    verifyDevice(@Body() device: {email: string, deviceToken: string}) {
        return this.otpService.verifyDevice(device.email, device.deviceToken);
    }

    @Post('generate')
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    generateDevice(@Body() device: {email: string, userAgent: string, ipCreated: string}) {
        return this.otpService.generateDeviceToken(device.email, device.userAgent, device.ipCreated);
    }
}