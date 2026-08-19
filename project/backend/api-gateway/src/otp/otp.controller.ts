/**
 * Controller: OtpController
 *
 * Manages one‑time password generation, email delivery, verification,
 * and trusted device storage api access points. Only authenticated
 * users can request for OTPs.
 * See {@link OtpService} for more details.
 *
 * Public methods:
 * - {@link OtpController#verifyOtp} – checks the OTP, removes it, creates a verified device token
 * - {@link OtpController#resendOtp} – resends a new OTP and emails it to the user
 */

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
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { ExtendedVerifyOtpDto, VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

@ApiTags('OTP')
@UseGuards(JwtAuthGuard)
@Controller('auth/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('verify-otp')
  @ApiOperation({
    summary: 'verfies otp that was sent to a specific email address',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        code: { type: 'string', example: '0123456' },
      },
    },
  })
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
    const { valid, deviceToken } = await this.otpService.verify(
      extendedDto,
      req.headers['authorization'] ?? '',
    );
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
  @ApiOperation({ summary: 'Resend OTP for email verification' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'test@example.com' },
      },
    },
  })
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.otpService.generateAndSend(dto.email);
  }
}
