import {
  Body,
  Controller,
  Post,
  Headers,
  HttpStatus,
  HttpCode,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { EmailStatusEnum } from './dto/status-enum.dto';
import { Public } from '../auth/public.decorator';
import { ResendReceivedWebhookPayloadDto } from '@phishshield/dto';
import { randomUUID } from 'node:crypto';
import { toReceivedReply } from './received-reply.mapper';
import { ResendWebhookGuard } from './resend-webhook.guard';

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    broadcast_id: string;
    created_at: string;
    email_id: string;
    message_id: string;
    from: string;
    to: string[];
    subject: string;
    template_id: string;
    bounce: {
      message: string;
      subType: string;
      type: string;
    };
    tags: {
      category: string;
    };
  };
}

@Controller('webhook')
export class WebhookController {
  private readonly analyticsServiceUrl: string;
  private readonly llmServiceUrl: string;
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.analyticsServiceUrl = this.config.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://localhost:3007',
    );
    this.llmServiceUrl = this.config.get<string>(
      'LLM_SERVICE_URL',
      'http://localhost:3008',
    );
  }

  @Public()
  @Post('create')
  @ApiOperation({ summary: 'Handle webhook from analytics service' })
  async handleAnalyticsWebhook(
    @Headers('svix-id') svixId: string,
    @Body() payload: ResendWebhookPayload,
  ) {
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/api/email-status/create`,
      method: 'POST',
      data: {
        emailId: payload.data.email_id,
        messageId: payload.data.message_id,
        status: payload.type as EmailStatusEnum,
        reason: payload.data.bounce?.message,
        webhookEventId: svixId,
        occurredAt: payload.data.created_at,
      },
    });
  }

  @Public()
  @Post('received')
  @UseGuards(ResendWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle Resend email.received (inbound reply) events',
  })
  @ApiBody({
    type: ResendReceivedWebhookPayloadDto,
    examples: {
      reply: {
        summary: 'Inbound reply',
        value: {
          type: 'email.received',
          created_at: '2026-09-21T09:40:00.000Z',
          data: {
            email_id: 'YOUR_RECEIVED_EMAIL_ID',
            message_id: '<abc123@mail.example.com>',
            from: 'Sarah Jacobs <sarah@acme.com>',
            to: ['it@acme-support.com'],
            cc: [],
            bcc: [],
            subject: 'Re: Unusual activity on your account',
            attachments: [],
          },
        },
      },
    },
  })
  @ApiHeader({ name: 'svix-id', required: false })
  @ApiHeader({ name: 'svix-timestamp', required: false })
  @ApiHeader({ name: 'svix-signature', required: false })
  async handleReceivedWebhook(
    @Body() body: ResendReceivedWebhookPayloadDto,
    @Headers('svix-id') svixId?: string,
  ) {
    if (body.type !== 'email.received') {
      this.logger.warn(`ignore triggered in api-gateway`);
      return { ignored: true };
    }

    return this.proxy.forward({
      url: `${this.llmServiceUrl}/api/llm/received_reply`,
      method: 'POST',
      data: toReceivedReply(body, svixId ?? randomUUID()),
    });
  }
}
