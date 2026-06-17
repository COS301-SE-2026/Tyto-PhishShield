import {IsEnum } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateStatusDto {
    @IsEnum(ReportStatus)
    status!: ReportStatus;
}