import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './otp.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Resend } from 'resend';

interface AxiosErrorShape {
  response?: { status: number; data?: unknown };
  message?: string;
}

@Injectable()
export class OtpService {
  private readonly resend: Resend;
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  async generateAndSend(email: string): Promise<void> {
    await this.otpRepo.delete({ email });
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const otp = this.otpRepo.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await this.otpRepo.save(otp);

    await this.sendOtpEmail(email, code);
  }

  private async sendOtpEmail(email: string, code: string): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: 'noreply@capstone-five-guys.dns.net.za',
        to: email,
        subject: 'Tyto-PhishShield OTP Code',
        html: `
                         <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                         <h2>PhishShield Email Verification</h2>
                         <p>Your verification code is:</p>
                         <h1 style="letter-spacing: 8px; color: #4F46E5;">${code}</h1>
                         <p>This code expires in <strong>5 minutes</strong>.</p>
                         <p>If you did not request this, please ignore this email.</p>
                         </div>`,
      });
      return true;
    } catch (err: unknown) {
      const e = err as AxiosErrorShape;
      console.error('Failed to send OTP email:', e.response?.data ?? e.message);
      throw new InternalServerErrorException('Failed to send OTP email');
    }
  }

  async verify(email: string, code: string): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: { email, code, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) return false;
    if (new Date() > otp.expiresAt) return false;

    otp.used = true;
    await this.otpRepo.save(otp);
    return true;
  }
}
