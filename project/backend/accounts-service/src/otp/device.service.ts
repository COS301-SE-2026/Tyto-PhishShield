/**
 * NB this file is deprecated!!!!!!!!!
 *
 * Service: OtpService
 *
 * Manages one‑time password generation, email delivery, verification,
 * and trusted device storage. Uses the Resend API for email and
 * stores verified devices in the local database via TypeORM.
 *
 * Public methods:
 * - {@link OtpService#generateAndSend} – creates an OTP and emails it to the user
 * - {@link OtpService#verify} – checks the OTP, removes it, creates a verified device token
 * - {@link OtpService#verifyDevice} – checks if the device token is still valid
 */

import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifiedDevice } from './device.entity';
import * as crypto from 'node:crypto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(VerifiedDevice)
    private readonly deviceRepo: Repository<VerifiedDevice>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async verifyDevice(email: string, deviceToken: string): Promise<boolean> {
    const user = await this.authService.getAuth0UserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    const hashedToken = crypto.hash('sha256', deviceToken);
    const trustedDevice = await this.deviceRepo.findOne({
      where: {
        tokenHash: hashedToken,
        userId: user.user_id,
      },
    });

    if (!trustedDevice) return false;

    trustedDevice.lastUsedAt = new Date();

    if (new Date() > trustedDevice.expiresAt) return false;

    await this.deviceRepo.update(trustedDevice.id, trustedDevice);

    return true;
  }

  async generateDeviceToken(
    email: string,
    userAgent: string,
    ipCreated: string,
  ): Promise<string> {
    const deviceToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.hash('sha256', deviceToken);
    const user = await this.authService.getAuth0UserByEmail(email);
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

    return deviceToken;
  }
}
