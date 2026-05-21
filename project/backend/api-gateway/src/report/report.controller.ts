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

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @HttpCode(201)
  createReport(@Body() body: CreateReportDto) {
    return this.reportService.save(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getAllReports() {
    return this.reportService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('xp')
  getUserXp(@Req() req: AuthenticatedRequest) {
    return this.reportService.getUserXp(req.user.email);
  }
}
