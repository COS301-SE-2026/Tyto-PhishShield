import { Injectable, Logger } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UserXpDto } from './dto/user-xp.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly savedReports: CreateReportDto[] = [];
  private readonly userXpStore: Record<string, number> = {};

  save(report: CreateReportDto, userId: string) {
    this.savedReports.push(report);

    const isPhishingEmail = report.from.includes(
      '@capstone-five-guys.dns.net.za',
    );
    let returnMessage: string;

    if (isPhishingEmail) {
      this.awardXp({ userId: userId, amount: 10 });
      returnMessage = 'phishing email detected';
    } else {
      returnMessage = 'not a phishing email';
      this.logger.log(
        `Report saved for user: ${userId}, but it was not a simulated phishing email.`,
      );
    }

    return {
      success: true,
      message: 'Report stored successfully',
      notification: returnMessage,
      reportId: this.savedReports.length,
    };
  }

  findAll() {
    return this.savedReports;
  }

  awardXp(dto: UserXpDto) {
    if (this.userXpStore[dto.userId] === undefined) {
      this.userXpStore[dto.userId] = 0;
    }

    this.userXpStore[dto.userId] += dto.amount;

    this.logger.log(
      `Awarded ${dto.amount} XP to ${dto.userId}. Total: ${this.userXpStore[dto.userId]}`,
    );

    return {
      success: true,
      userId: dto.userId,
      added: dto.amount,
      newTotal: this.userXpStore[dto.userId],
    };
  }

  getAllXp() {
    return this.userXpStore;
  }

  getUserXp(userId: string) {
    return {
      userId,
      xp: this.userXpStore[userId] || 0,
    };
  }
}
