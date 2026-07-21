import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ClientProxy } from '@nestjs/microservices';

interface ReporterUser {
  auth0Id: string;
  email: string;
  role: string;
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,
    @Inject('REPORT_EVENTS') private readonly rmqClient: ClientProxy,
  ) {}

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

    this.rmqClient.emit('report.created', {
      reportId: saved.id,
      auth0Id: saved.auth0Id,
      reporterEmail: saved.reporterEmail,
      emailSubject: saved.emailSubject,
      emailSender: saved.emailSender,
      createdAt: saved.createdAt,
    });
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
