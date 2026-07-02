import { Controller, Post, Body, HttpCode, BadRequestException, Logger, } from '@nestjs/common';
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

  @Post('send')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate and email a 6-digit OTP to the given address' })
  async sendOtp(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('email is required');

    const code = this.otpService.generate(body.email);
    const resendKey = this.config.get<string>('RESEND_API_KEY', '');
    const fromEmail = this.config.get<string>('RESEND_EMAIL', 'onboarding@resend.dev');
    const isDev = this.config.get<string>('NODE_ENV', 'development') !== 'production';

    try {
      await this.proxy.forward({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        data: {
          from: `PhishShield <${fromEmail}>`,
          to: [body.email],
          subject: 'Your PhishShield verification code',
          html: `
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="font-size:20px;margin-bottom:8px">Verify your email</h2>
              <p style="color:#64748b;margin-bottom:24px">Enter the code below to complete your PhishShield registration.</p>
              <div style="background:#f1f5f9;border-radius:10px;padding:24px;text-align:center;letter-spacing:10px;font-size:36px;font-weight:700;color:#1e293b">
                ${code}
              </div>
              <p style="color:#94a3b8;font-size:12px;margin-top:20px">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
            </div>`,
        },
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
      });
      return { message: 'OTP sent' };
    } catch (err: unknown) {
      if (!isDev) throw err;
      // Resend sandbox only allows sending to the verified account email, so we have to log the code for now so the registration could still be completed
      this.logger.warn(`Resend blocked send to ${body.email} — dev code: ${code}`);
      return { message: 'OTP sent (dev)', devCode: code };
    }
  }

  @Post('verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify an OTP code for the given email' })
  verifyOtp(@Body() body: { email: string; code: string }) {
    if (!body.email || !body.code) throw new BadRequestException('email and code are required');
    const valid = this.otpService.verify(body.email, body.code);
    if (!valid) throw new BadRequestException('Invalid or expired verification code');
    return { message: 'Email verified successfully' };
  }
}