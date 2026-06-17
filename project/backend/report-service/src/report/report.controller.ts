import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
    user: {
        auth0Id: string;
        email: string;
        role: string;

    }
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    @Post()
    @ApiOperation({ summary: 'Submit a phishing report from the Outlook add-in' })
    create(@Req() req: AuthenticatedRequest, @Body() dto: CreateReportDto) {
        return this.reportService.create(req.user, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all reports'})
    findAll() {
        return this.reportService.findAll();
    }

    @Get('mine')
    @ApiOperation({ summary: 'Get current user reports'})
    getMyReports(@Req() req: AuthenticatedRequest) {
        return this.reportService.findByUser(req.user.auth0Id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific report'})
    findOne(@Param('id') id: string) {
        return this.reportService.findById(id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update the status of a specific report(admin/analyst only)'})
    updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
        return this.reportService.updateStatus(id, dto);
    }
}