import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifiedDevice } from './otp.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { Resend } from 'resend';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface AxiosErrorShape {
  response?: { status: number; data?: unknown };
  message?: string;
}

interface OTP {
  email: string;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  private readonly resend: Resend;
  private OTPs: OTP[];

  constructor(
    @InjectRepository(VerifiedDevice)
    private readonly otpRepo: Repository<VerifiedDevice>,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.OTPs = [];
  }

  async generateAndSend(email: string, userAgent: string, ipCreated: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return '';
    }
    await this.otpGenAndSend(email);

    const deviceToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.hash('sha256', deviceToken);

    const verifiedDevice = this.otpRepo.create({
      userId: user.auth0Id,
      tokenHash: hashedToken,
      userAgent: userAgent,
      ipCreated: ipCreated,
      lastUsedAt: Date.now(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });
    await this.otpRepo.save(verifiedDevice);

    return deviceToken;
  }

  private async otpGenAndSend(email: string): Promise<void> {
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    this.OTPs.push({
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    })
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
    const otp = this.OTPs.find(otp => otp.email === email);

    if (!otp) return false;
    if (new Date() > otp.expiresAt) return false;

    const updatedOTPs = this.OTPs.filter(otp => otp.email !== email);
    this.OTPs = updatedOTPs;
    
    return true;
  }
}
