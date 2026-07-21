import {
  ConflictException,
  Logger,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Reportable } from './entities/reportable.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

interface ReporterUser {
  auth0Id: string;
  email: string;
  role: string;
}

interface EmailSentPayload {
  recipient: string;
  referenceNumber: string;
  scheduledAt: string;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,
    @InjectRepository(Reportable)
    private readonly reportableRepo: Repository<Reportable>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async recordSentEmail(payload: EmailSentPayload): Promise<void> {
    const existing = await this.reportableRepo.findOne({
      where: { referenceNumber: payload.referenceNumber },
    });

    if (existing) {
      return;
    }

    const reportable = this.reportableRepo.create({
      referenceNumber: payload.referenceNumber,
      recipient: payload.recipient,
      sentAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
    });

    await this.reportableRepo.save(reportable);

    this.logger.log(`Recorded sent phishing email: ${payload.referenceNumber}`);
  }

  async create(user: ReporterUser, dto: CreateReportDto): Promise<Report> {
    //this first part is to prevent duplicate reports of the same email
    const existing = await this.repo.findOne({
      where: {
        auth0Id: user.auth0Id,
        outlookMessageId: dto.outlookMessageId,
      },
    });

    if (existing) {
      throw new ConflictException('You have already reported this email.');
    }

    const report = this.repo.create({
      auth0Id: user.auth0Id,
      reporterEmail: user.email,
      outlookMessageId: dto.outlookMessageId,
      emailSubject: dto.emailSubject,
      emailSender: dto.emailSender,
      emailBody: dto.emailBody,
      emailReceivedAt: dto.emailReceivedAt
        ? new Date(dto.emailReceivedAt)
        : undefined,
      notes: dto.notes,
      status: ReportStatus.PENDING,
    });

    const saved = await this.repo.save(report);

    const matchedReportable = await this.reportableRepo.findOne({
      where: { messageId: dto.outlookMessageId ?? '' },
    });

    if (matchedReportable) {
      saved.status = ReportStatus.CONFIRMED_PHISHING;
      await this.repo.save(saved);

      try {
        await this.amqpConnection.publish('xp-event-exchange', 'xp.give', {
          auth0Id: user.auth0Id,
          amount: 10,
          reason: 'Valid phishing report',
        });
        this.logger.log(`Published xp.give for user ${user.auth0Id}`);
      } catch (err) {
        this.logger.error(`Failed to publish xp.give for ${user.auth0Id}`, err);
      }
    } else {
      try {
        await this.amqpConnection.publish('education-event-exchange', 'education.assign', {
          auth0Id: user.auth0Id,
          email: user.email,
          reportId: saved.id,
        },
        );
        this.logger.log(`Published education.assign for user ${user.auth0Id}`);
      } catch (err) {
        this.logger.error(`Failed to publish education.assign for ${user.auth0Id}`, err);
      }
    }
    return saved;
  }

  findAll(): Promise<Report[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByUser(auth0Id: string): Promise<Report[]> {
    return this.repo.find({ where: { auth0Id }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Report> {
    const report = await this.repo.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async updateStatus(id: string, dto: UpdateStatusDto): Promise<Report> {
    const report = await this.findById(id);
    report.status = dto.status;
    return this.repo.save(report);
  }
}
