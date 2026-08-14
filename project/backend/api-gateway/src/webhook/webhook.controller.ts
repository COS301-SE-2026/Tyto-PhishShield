import { Body, Controller, Post, Headers } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';
import { EmailStatusEnum } from './dto/status-enum.dto';
import { Public } from '../auth/public.decorator';

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

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    const port = this.config.get<string>('ANALYTICS_SERVICE_PORT', '3007');
    this.analyticsServiceUrl = `http://localhost:${port}`;
  }

  @Public()
  @Post('create')
  @ApiOperation({ summary: 'Handle webhook from analytics service' })
  async handleAnalyticsWebhook(
    @Headers('svix-id') svixId: string,
    @Body() payload: ResendWebhookPayload,
  ) {
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/email-status/create`,
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
}
