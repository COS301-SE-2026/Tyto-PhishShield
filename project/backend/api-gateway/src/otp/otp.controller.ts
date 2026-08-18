import {
  Controller,
  Post,
  Body,
  HttpCode,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { ExtendedVerifyOtpDto, VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

@ApiTags('OTP')
@Controller('auth/otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService
  ) {}

  @Post('verify-otp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async verifyOtp(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const extendedDto: ExtendedVerifyOtpDto = {
      email: dto.email,
      code: dto.code,
      userAgent: req.header('user-agent') ?? '',
      ip: req.ip,
    };
    const { valid, deviceToken } =
      await this.otpService.verify(extendedDto, req.headers['authorization'] ?? '');
    res.cookie('device_token', deviceToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000,
    });
    if (valid) return 'OTP verified!';
    else throw new UnauthorizedException('Invalid OTP');
  }

  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.otpService.generateAndSend(dto.email);
  }
}
