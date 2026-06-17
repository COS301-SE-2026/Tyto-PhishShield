import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

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
    ) {}

    async create(user: ReporterUser, dto: CreateReportDto): Promise<Report> {
        const report = this.repo.create({
            auth0Id: user.auth0Id,
            reporterEmail: user.email,
            outlookMessageId: dto.outlookMessageId,
            emailSubject: dto.emailSubject,
            emailSender: dto.emailSender,
            emailBody: dto.emailBody,
            emailReceivedAt: dto.emailReceivedAt ? new Date(dto.emailReceivedAt) : undefined,
            notes: dto.notes,
            status: ReportStatus.PENDING,
        });
        return this.repo.save(report);
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