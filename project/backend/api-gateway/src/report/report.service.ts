import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UserXpDto } from './dto/user-xp.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReportService {
  private readonly savedReports: CreateReportDto[] = [];
  private readonly userXpStore: Record<string, number> = {};

  constructor(private readonly configService: ConfigService) {}

  save(report: CreateReportDto, userId: string) {
    this.savedReports.push(report);

    const domain = this.configService.get<string>('FIVEGUYS_DOMAIN') || '';

    const isPhishingEmail = report.from.includes(domain);
    let returnMessage: string;

    if (isPhishingEmail) {
      this.awardXp({ userId: userId, amount: 10 });
      returnMessage = 'phishing email detected';
    } else {
      returnMessage = 'not a phishing email';
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
