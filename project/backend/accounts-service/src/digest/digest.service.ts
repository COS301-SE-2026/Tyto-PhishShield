import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { User } from '../users/entities/user.entity';

interface UserStats {
  reports: number;
  confirmed: number;
  falsePositive: number;
  totalXp: number;
  educationCompleted: number;
  securityScore: number;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject('ANALYTICS_SERVICE')
    private readonly analyticsClient: ClientProxy,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.fromAddress = this.config.get<string>(
      'RESEND_EMAIL',
      'noreply@phishshield.local',
    );
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyDigests(): Promise<void> {
    const users = await this.userRepo.find({
      where: { weeklyDigestOptIn: true, isActive: true },
    });
    this.logger.log(`Sending weekly digest to ${users.length} opted-in users`);
    for (const user of users) {
      try {
        await this.sendDigestToUser(user);
      } catch (err) {
        this.logger.error(`Failed to send digest to ${user.auth0Id}`, err);
      }
    }
  }

  async sendDigestToUser(user: User): Promise<void> {
    const stats = await firstValueFrom(
      this.analyticsClient.send<UserStats>(
        'analytics.getUserStats',
        user.auth0Id,
      ),
    );

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: user.email,
      subject: 'Your Weekly Tyto PhishShield Security Digest',
      html: this.buildDigestHtml(user, stats),
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }

  private buildDigestHtml(user: User, stats: UserStats): string {
    const detectionRate =
      stats.reports > 0
        ? Math.round((stats.confirmed / stats.reports) * 100)
        : 0;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <h2 style="color: #2563EB;">Your Weekly Security Digest</h2>
        <p>Hi ${user.name ?? user.firstName ?? 'there'},</p>
        <p>Here's your phishing-awareness summary for the past week:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Security Score</td><td style="text-align: right; font-weight: bold;">${stats.securityScore}%</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total XP</td><td style="text-align: right; font-weight: bold;">${stats.totalXp}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Emails Reported</td><td style="text-align: right; font-weight: bold;">${stats.reports}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Detection Rate</td><td style="text-align: right; font-weight: bold;">${detectionRate}%</td></tr>
          <tr><td style="padding: 8px 0;">Training Modules Completed</td><td style="text-align: right; font-weight: bold;">${stats.educationCompleted}</td></tr>
        </table>
        <p style="color: #666; font-size: 12px;">Keep up the good work spotting phishing attempts. Log in to Tyto PhishShield to see your full dashboard.</p>
      </div>
    `;
  }
}
