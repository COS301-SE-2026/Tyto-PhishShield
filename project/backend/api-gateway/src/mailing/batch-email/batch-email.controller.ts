import {
  Controller,
  Post,
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
import { SendBatchEmailDto } from '../dto/send-batch-email.dto';
import { SendBatchRandomDto } from '../dto/send-batch-random.dto';

@ApiTags('Batch Emails')
@Controller('batch-emails')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BatchEmailController {
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

  @Post(':referenceNumber/send-batch-with-reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send one email template to many recipients immediately',
  })
  @ApiParam({ name: 'referenceNumber', type: 'string', example: 'PHISH-001' })
  @ApiBody({
    schema: { example: { recipients: ['a@example.com', 'b@example.com'] } },
  })
  sendBatchWithReference(
    @Param('referenceNumber') referenceNumber: string,
    @Body() body: SendBatchEmailDto,
  ) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/batch-emails/${referenceNumber}/send-batch-with-reference`,
      method: 'POST',
      data: body,
    });
  }

  @Post('send-batch-random-same-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send one randomly selected email template to all recipients',
  })
  @ApiBody({
    schema: {
      example: {
        recipients: ['a@example.com', 'b@example.com'],
        difficulty: 'medium',
        scheduledFrom: '2026-06-24T10:00:00.000Z',
        scheduledTo: '2026-06-24T12:00:00.000Z',
        randomisedTimes: true,
      },
    },
  })
  sendBatchRandomSameEmail(@Body() body: SendBatchRandomDto) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/batch-emails/send-batch-random-same-email`,
      method: 'POST',
      data: body,
    });
  }

  @Post('send-batch-random-different-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Send a different randomly selected email template to each recipient',
  })
  @ApiBody({
    schema: {
      example: {
        recipients: ['a@example.com', 'b@example.com'],
        difficulty: 'medium',
        scheduledFrom: '2026-06-24T10:00:00.000Z',
        scheduledTo: '2026-06-24T12:00:00.000Z',
        randomisedTimes: true,
      },
    },
  })
  sendBatchRandomDifferentEmail(@Body() body: SendBatchRandomDto) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/batch-emails/send-batch-random-different-email`,
      method: 'POST',
      data: body,
    });
  }
}
