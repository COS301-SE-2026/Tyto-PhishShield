/**
 * Service: OtpService
 *
 * Manages one‑time password generation, email delivery, verification,
 * and trusted device storage. Uses the Resend API for email and
 * stores verified devices in the local database via TypeORM.
 *
 * Public methods:
 * - {@link OtpService#generateAndSend} – creates an OTP and emails it to the user
 * - {@link OtpService#verify} – checks the OTP, removes it, creates a verified device token
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { Resend } from 'resend';
import { ProxyService } from '../proxy/proxy.service';
import { ExtendedVerifyOtpDto } from '../dto/verify-otp.dto';
import { logger } from '../logger/logger.service';

interface AxiosErrorShape {
  response?: { status: number; data?: unknown };
  message?: string;
}

interface OTP {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly resend: Resend;
  private OTPs: OTP[];
  private readonly accountsServiceUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly proxy: ProxyService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.OTPs = [];
    this.accountsServiceUrl = this.config.get<string>(
      'ACCOUNTS_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  async generateAndSend(email: string): Promise<void> {
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    this.removeOtp(email);
    this.OTPs.push({
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });
    await this.sendOtpEmail(email, code);
  }

  //Method to actually send the OTP email
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

  async verify(
    verifyOtp: ExtendedVerifyOtpDto,
    token: string,
  ): Promise<{ valid: boolean; deviceToken: string }> {
    //Find otp in list
    const otp = this.OTPs.find((otp) => otp.email === verifyOtp.email);

    //Check if otp exists or is valid or has reached max attempts
    if (!otp) return { valid: false, deviceToken: '' };
    if (new Date() > otp.expiresAt || otp.attempts > 5) {
      this.removeOtp(otp.email);
      return { valid: false, deviceToken: '' };
    }
    if (otp.code !== verifyOtp.code) {
      otp.attempts += 1;
      const newOtps = this.OTPs.map((otpItem) =>
        otpItem.email === otp.email
          ? { ...otpItem, attempts: otp.attempts }
          : otpItem,
      );
      this.OTPs = newOtps;
      return { valid: false, deviceToken: '' };
    }
    this.removeOtp(otp.email);

    //At this point the OTP is valid
    //Ask accounts to generate a device token and return the token
    let deviceToken = '';
    try {
      const res: string = await this.proxy.forward({
        url: `${this.accountsServiceUrl}/api/auth/device/generate`,
        method: 'POST',
        data: {
          email: verifyOtp.email,
          userAgent: verifyOtp.userAgent,
          ipCreated: verifyOtp.ip,
        },
        headers: { Authorization: token },
      });
      deviceToken = res;
    } catch (err: unknown) {
      logger.warn('unable to generate device token', err);
    }

    return { valid: true, deviceToken };
  }

  private removeOtp(email: string) {
    const newOtps = this.OTPs.filter((otpItem) => otpItem.email !== email);
    this.OTPs = newOtps;
  }
}
