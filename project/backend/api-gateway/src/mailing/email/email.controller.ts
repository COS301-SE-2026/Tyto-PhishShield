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
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';
import { ProxyService } from '../../proxy/proxy.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EmailsDto } from '../dto/emails.dto';

@ApiTags('Emails')
@Controller('emails')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  private readonly mailingServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.mailingServiceUrl = this.config.get<string>(
      'MAILING_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new email' })
  createEmail(@Body() body: EmailsDto) {
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
    @Body() body: Partial<EmailsDto>,
  ) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails/${referenceNumber}`,
      method: 'PATCH',
      data: body,
    });
  }

  @Post(':referenceNumber/send-single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch the email with Resend' })
  @ApiParam({ name: 'referenceNumber', type: 'string', example: 'PHISH-001' })
  @ApiBody({ schema: { example: { recipient: 'target@example.com' } } })
  sendEmail(
    @Param('referenceNumber') referenceNumber: string,
    @Body('recipient') recipient: string,
  ) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails/${referenceNumber}/send-single`,
      method: 'POST',
      data: { recipient },
    });
  }

  @Post(':referenceNumber/schedule-send-single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule the email via Resend' })
  @ApiParam({ name: 'referenceNumber', type: 'string', example: 'PHISH-001' })
  @ApiBody({
    schema: {
      example: {
        recipient: 'target@example.com',
        scheduledAt: '2026-05-25T14:30:00.000Z',
      },
    },
  })
  scheduleSendEmail(
    @Param('referenceNumber') referenceNumber: string,
    @Body('recipient') recipient: string,
    @Body('scheduledAt') scheduledAt: string,
  ) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/emails/${referenceNumber}/schedule-send-single`,
      method: 'POST',
      data: { recipient, scheduledAt },
    });
  }
}
