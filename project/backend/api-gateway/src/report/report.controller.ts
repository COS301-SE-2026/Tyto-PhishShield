import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles} from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

function authHeader(req: Request): Record<string, string> {
  const token = req.headers['authorization'];
  return token ? { Authorization: token } : {};
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
      'http://localhost:3004',
    );
  }

  @Public()
  @Post('auth/microsoft')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange Microsoft SSO token for user identity' })
  exchangeMicrosoft(@Body('token') token: string) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/auth/microsoft`,
      method: 'POST',
      data: { token },
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a phishing report from the Outlook Add-in' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        outlookMessageId: { type: 'string', example: 'MSG-001' },
        emailSubject: { type: 'string', example: 'Urgent password reset' },
        emailSender: {
          type: 'string',
          example: 'phisher@capstone-five-guys.dns.net.za',
        },
        emailBody: {
          type: 'string',
          example: 'Click here to reset your password…',
        },
        emailReceivedAt: { type: 'string', example: '2026-07-22T10:00:00Z' },
        notes: { type: 'string', example: 'Looks suspicious' },
      },
    },
  })
  create(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report`,
      method: 'POST',
      data: body,
      headers: authHeader(req),
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (admin/analyst)' })
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
  @ApiOperation({ summary: 'Get current user reports' })
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
  @ApiOperation({ summary: 'Get a specific report' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report/${id}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report status (admin/analyst)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'reviewed', 'confirmed_phishing', 'false_positive'],
        },
      },
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.proxy.forward({
      url: `${this.reportServiceUrl}/api/report/${id}/status`,
      method: 'PATCH',
      data: body,
      headers: authHeader(req),
    });
  }
}
