import { Injectable, InternalServerErrorException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Otp } from './otp.entity';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
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
    private readonly http: HttpService,
    private readonly config: ConfigService
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  async generateAndSend(email: string): Promise<void> {
    await this.otpRepo.delete({ email });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = this.otpRepo.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await this.otpRepo.save(otp);

    await this.sendOtpEmail(email, code);
  }

  private async sendOtpEmail(email: string, code: string): Promise<boolean> {
    // const mailingUrl = this.config.get<string>(
    //   'MAILING_SERVICE_URL',
    //   'http://localhost:3003',
    // );
    // const fromEmail = this.config.get<string>(
    //   'RESEND_EMAIL',
    //   'onboarding@resend.dev',
    // );

    //let referenceNumber: string;

    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
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
      // const { data } = await firstValueFrom(
      //   this.http.post<{ reference_number: string }>(`${mailingUrl}/emails`, {
      //     sender: fromEmail,
      //     subject: 'Your OTP Code',
      //     content: `
      //                   <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      //                   <h2>PhishShield Email Verification</h2>
      //                   <p>Your verification code is:</p>
      //                   <h1 style="letter-spacing: 8px; color: #4F46E5;">${code}</h1>
      //                   <p>This code expires in <strong>5 minutes</strong>.</p>
      //                   <p>If you did not request this, please ignore this email.</p>
      //                   </div>
      //               `,
      //     recipient: email,
      //   }),
      //);
      //referenceNumber = data.reference_number;
    } catch (err: unknown) {
      const e = err as AxiosErrorShape;
      console.error(
        'Failed to send OTP email:',
        e.response?.data ?? e.message,
      );
      throw new InternalServerErrorException('Failed to send OTP email');
    }

    // try {
    //   await firstValueFrom(
    //     this.http.post(`${mailingUrl}/emails/${referenceNumber}/send-single`, {
    //       emailReferenceNumber: referenceNumber,
    //       recipient: email,
    //     }),
    //   );
    // } catch (err: unknown) {
    //   const e = err as AxiosErrorShape;
    //   console.warn(
    //     'OTP email could not be sent (mailing service issue):',
    //     e.response?.data ?? e.message,
    //   );
    //   //throw new InternalServerErrorException('Failed to send OTP email');
    // }
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
