import { Body, Controller, Logger, Post } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { MailingEventService } from './mailing-event.service';
import { ConfirmMessageIdDto } from './dto/confirm-message-id.dto';

interface SingleMailingEventPayload {
  emailId?: string;
  auth0Id?: string;
  recipientAuth0Id?: string;
}
interface BatchMailingEventEntry {
  auth0Id: string;
  emailId: string;
}
interface BatchMailingEventPayload {
  entries: BatchMailingEventEntry[];
}

const MAILING_EVENT_EXCHANGE = 'mailing-event-exchange';
const TRACKED_ROUTING_KEYS = [
  'mailing.send',
  'mailing.schedule',
  'mailing.batch_send',
  'mailing.batch_schedule',
  'mailing.spear_phishing',
  'mailing.reply',
];

@Controller('mailing-event')
export class MailingEventController {
  private readonly logger = new Logger(MailingEventController.name);

  constructor(private readonly mailingEventService: MailingEventService) {}

  @RabbitSubscribe({
    exchange: MAILING_EVENT_EXCHANGE,
    routingKey: TRACKED_ROUTING_KEYS,
    queue: 'llm-sent-message-tracking-queue',
  })
  async handleMailingEvent(
    payload: SingleMailingEventPayload | BatchMailingEventPayload,
    msg: { fields: { routingKey: string } },
  ): Promise<void> {
    const routingKey = msg.fields.routingKey;

    if ('entries' in payload) {
      await this.mailingEventService.recordBatch(routingKey, payload.entries);
      return;
    }

    await this.mailingEventService.recordSingle(
      routingKey,
      payload.emailId,
      payload.recipientAuth0Id ?? payload.auth0Id,
    );
  }

  @Post('confirm-message-id')
  async confirmMessageId(
    @Body() dto: ConfirmMessageIdDto,
  ): Promise<{ success: boolean }> {
    await this.mailingEventService.backfillMessageId(
      dto.emailId,
      dto.messageId,
    );
    return { success: true };
  }
}
