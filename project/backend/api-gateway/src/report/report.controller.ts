import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @HttpCode(201)
  createReport(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateReportDto,
  ) {
    return this.reportService.save(body, req.user.auth0Id);
  }

  @Get()
  getAllReports() {
    return this.reportService.findAll();
  }

  @Get('xp')
  getUserXp(@Req() req: AuthenticatedRequest) {
    return this.reportService.getUserXp(req.user.auth0Id);
  }
}
