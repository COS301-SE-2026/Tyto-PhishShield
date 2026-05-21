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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly proxy: ProxyService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'reports an email' })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'subject',
        'from',
        'senderName',
        'itemId',
        'internetMessageId',
        'dateTimeCreated',
        'dateReported',
        'body',
        'source',
      ],
      properties: {
        subject: { type: 'string', example: 'Welcome to Tyto-PhishShield' },
        from: { type: 'string', example: 'fiveguys@gmail.com' },
        senderName: { type: 'string', example: 'Five Guys' },
        itemId: { type: 'string', example: '1234' },
        internetMessageId: { type: 'string', example: 'ab75f23ce2' },
        dateTimeCreated: { type: 'string', example: '2026-05-18' },
        dateReported: { type: 'string', example: '2026-05-18' },
        body: {
          type: 'string',
          example: 'Hello, would you like to have some cookies?',
        },
        source: { type: 'string', example: 'outlook-addin' },
      },
    },
  })
  @ApiBearerAuth()
  @HttpCode(201)
  createReport(@Body() body: CreateReportDto) {
    return this.reportService.save(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  getAllReports() {
    return this.reportService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('xp')
  @ApiBearerAuth()
  async getUserXp(@Req() req: AuthenticatedRequest) {
    const userData: { email: string } = await this.proxy.forward({
      url: `http://localhost:3001/api/accounts/auth/me`,
      method: 'GET',
      headers: {
        Authorization: req.headers.authorization ?? '',
      },
    });
    //console.log('User data retrieved from accounts service:', userData);
    return this.reportService.getUserXp(userData.email);
  }
}
