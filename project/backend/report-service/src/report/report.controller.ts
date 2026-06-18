import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagePattern } from '@nestjs/microservices';

interface AuthenticatedRequest extends Request {
  user: {
    auth0Id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a phishing report from the Outlook add-in' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    return this.reportService.create(req.user, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (admin/analyst)' })
  findAll() {
    return this.reportService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reports' })
  getMyReports(@Req() req: AuthenticatedRequest) {
    return this.reportService.findByUser(req.user.auth0Id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific report' })
  findOne(@Param('id') id: string) {
    return this.reportService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the status of a specific report(admin/analyst only)',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.reportService.updateStatus(id, dto);
  }

  @MessagePattern('report.findByUser')
  findByUserTcp(auth0Id: string) {
    return this.reportService.findByUser(auth0Id);
  }

  @MessagePattern('report.findById')
  findByIdTcp(id: string) {
    return this.reportService.findById(id);
  }
}
