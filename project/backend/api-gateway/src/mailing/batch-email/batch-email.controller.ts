/**
 * Service: api-gateway
 *
 * Proxies incoming HTTP requests for batch email operations to the waves-service.
 * Validates JWT authentication and forwards each request via ProxyService.
 *
 * Functions:
 * - {@link BatchEmailController#sendBatchRandom} - Forwards a request to send one randomly selected or chosen email (by difficulty) to all recipients.
 * - {@link BatchEmailController#sendBatchRandomDifferentEmail} - Forwards a request to send a different randomly selected email (by difficulty) to each recipient.
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { ProxyService } from '../../proxy/proxy.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SendBatchDto } from '../dto/send-batch.dto';
import { SendBatchRandomDto } from '../dto/send-batch-random.dto';
import { SendBatchEmailDto } from '../dto/send-batch-email.dto';

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
    summary:
      'Send one random / chosen email to all recipients. referenceNumber and randomisedTimes are optional',
  })
  @ApiBody({
    type: SendBatchDto,
    examples: {
      default: {
        summary: 'Same email to a batch of recipients',
        value: {
          auth0Id: ['auth0|1', 'auth0|2'],
          difficulty: 'medium',
          scheduledFrom: '2026-09-01T08:00:00.000Z',
          scheduledTo: '2026-09-05T17:00:00.000Z',
          randomisedTimes: true,
          waveName: 'Finance Phishing Wave',
          referenceNumber: 'PHISH-001',
        },
      },
    },
  })
  sendBatchRandom(@Body() body: SendBatchDto) {
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
      'Send a different randomly selected email to each recipient. randomisedTimes is optional',
  })
  @ApiBody({
    type: SendBatchRandomDto,
    examples: {
      default: {
        summary: 'Different email per recipient',
        value: {
          auth0Id: ['auth0|1', 'auth0|2'],
          difficulty: 'medium',
          scheduledFrom: '2026-09-01T08:00:00.000Z',
          scheduledTo: '2026-09-05T17:00:00.000Z',
          randomisedTimes: true,
          waveName: 'Finance Phishing Wave',
        },
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
