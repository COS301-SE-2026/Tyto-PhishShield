import {
  Controller, Post, Get, Patch,
  Body, Param, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

function authHeader(req: Request): Record<string, string> {
  const token = req.headers['authorization'];
  return token ? {Authorization: token} : {};
}

@ApiTags('Reports')
@Controller('report')
export class ReportController {
  private readonly reportServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {

    this.reportServiceUrl = this.config.get<string>(
      'REPORT_SERVICE_URL',
      'http://localhost:3004'
    );
    
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a phishing report from the Outlook Add-in'})
  create(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report`,
      method: 'POST',
      data: body,
      headers: authHeader(req),
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (admin/analyst)'})
  findAll(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reports'})
  getMyReports(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report/mine`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific report'})
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report/${id}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report status (admin/analyst)'})
  updateStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  )
   {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report/${id}/status`,
      method: 'PATCH',
      data: body,
      headers: authHeader(req),
    });
  }




}