/**
 * MailingController — exposes mailing-related HTTP endpoints.
 *
 * - Handles creation, retrieval, update and send actions for emails/campaigns.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateEmailDto } from './dto/generate-email.dto';

@ApiTags('Mailing')
@Controller('emails')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MailingController {
  private readonly mailingServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    const port = this.config.get<number>('MAILING_SERVICE_PORT', 3003);
    this.mailingServiceUrl = `http://localhost:${port}`;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new email' })
  createEmail(@Body() body: GenerateEmailDto) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails`,
      method: 'POST',
      data: body,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all generated emails' })
  getAllEmails() {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails`,
      method: 'GET',
    });
  }

  @Get(':referenceNumber')
  @ApiOperation({ summary: 'Get a specific email by its reference number' })
  @ApiParam({ name: 'referenceNumber', type: 'string', example: 'PHISH-001' })
  getEmailByReference(@Param('referenceNumber') referenceNumber: string) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails/${referenceNumber}`,
      method: 'GET',
    });
  }

  @Patch(':referenceNumber')
  @ApiOperation({ summary: 'Update an existing email' })
  @ApiParam({ name: 'referenceNumber', type: 'string', example: 'PHISH-001' })
  updateEmail(
    @Param('referenceNumber') referenceNumber: string,
    @Body() body: GenerateEmailDto,
  ) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails/${referenceNumber}`,
      method: 'PATCH',
      data: body,
    });
  }

  @Post(':referenceNumber/send-single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch the email via Resend' })
  @ApiParam({ name: 'referenceNumber', type: 'string', example: 'PHISH-001' })
  sendEmail(@Param('referenceNumber') referenceNumber: string) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails/${referenceNumber}/send-single`,
      method: 'POST',
    });
  }
}
