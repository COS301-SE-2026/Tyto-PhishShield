import {
  Controller,
  Post,
  Body,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('OTP')
@Controller('auth/otp')
export class OtpController {
  private readonly logger = new Logger(OtpController.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {}

  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(
    @Req() req: Request,
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const extendedDto: ExtendedVerifyOtpDto = {
      email: dto.email,
      code: dto.code,
      userAgent: req.header('user-agent') ?? '',
      ip: req.ip,
    };
    const { message, deviceToken } =
      await this.otpService.verify(extendedDto);
    res.cookie('device_token', deviceToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000,
    });
    return { message };
  }

  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.otpService.generateAndSend(dto);
  }
}
