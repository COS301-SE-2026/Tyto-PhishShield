import { forwardRef, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifiedDevice } from './otp.entity';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { Resend } from 'resend';
import { AuthService } from '../auth/auth.service';

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
    private readonly deviceRepo: Repository<VerifiedDevice>,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.OTPs = [];
  }

  async generateAndSend(email: string): Promise<void> {
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

  async verify(email: string, code: string,  userAgent: string, ipCreated: string): Promise<{valid: boolean, deviceToken: string}> {
    const otp = this.OTPs.find(otp => otp.email === email);

    if (!otp) return {valid: false, deviceToken: ''};
    if (new Date() > otp.expiresAt || otp.code !== code) return  {valid: false, deviceToken: ''};

    const updatedOTPs = this.OTPs.filter(otp => otp.email !== email);
    this.OTPs = updatedOTPs;

    const deviceToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.hash('sha256', deviceToken);
    const user = await this.authService.getAuth0UserByEmail(email);
    console.log(user);
    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    const verifiedDevice = this.deviceRepo.create({
      userId: user.user_id,
      tokenHash: hashedToken,
      userAgent: userAgent,
      ipCreated: ipCreated,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });
    await this.deviceRepo.save(verifiedDevice);

    return  {valid: true, deviceToken};
  }

  async verifyDevice(email: string, deviceToken: string): Promise<boolean> {
    const user = await this.authService.getAuth0UserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    const hashedToken = crypto.hash('sha256', deviceToken);
    console.log(hashedToken);
    let trustedDevice = await this.deviceRepo.findOne({
      where: {
        tokenHash: hashedToken,
        userId: user.user_id,
      }
    });

    if (!trustedDevice) return false;

    trustedDevice.lastUsedAt = new Date();

    if (new Date() > trustedDevice.expiresAt) return false;

    await this.deviceRepo.update(trustedDevice.id, trustedDevice);

    return true;
  }
}
