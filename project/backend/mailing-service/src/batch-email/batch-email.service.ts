import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailDifficulty, Emails } from '../entities/emails.entity';
import { In, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

const MAILING_EVENT_EXCHANGE = 'mailing-event-exchange';

interface BatchSendResult {
  success: boolean;
  message: string;
}

interface RecipientDispatch {
  recipient: string;
  referenceNumber: string;
  scheduledAt: Date;
}

interface ResendBatchItem {
  from: string;
  to: string[];
  subject: string;
  html: string;
  scheduledAt?: string;
}

@Injectable()
export class BatchEmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(BatchEmailService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Emails)
    private readonly emailRepository: Repository<Emails>,
    private readonly amqpConnection: AmqpConnection,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendBatchWithReference(
    referenceNumber: string,
    recipients: string[],
  ): Promise<BatchSendResult> {
    const now = new Date();

    const dispatches: RecipientDispatch[] = recipients.map((recipient) => ({
      recipient,
      referenceNumber: referenceNumber,
      scheduledAt: now,
    }));

    return this.dispatchBatch(dispatches, `reference ${referenceNumber}`);
  }

  async sendBatchRandomSameEmail(
    recipients: string[],
    difficulty: EmailDifficulty,
    scheduledFrom: Date,
    scheduledTo: Date,
    randomisedTimes: boolean,
  ): Promise<BatchSendResult> {
    // Makes sure scheduledFrom <= scheduledTo
    this.validateScheduleWindow(scheduledFrom, scheduledTo);

    const referenceNumber = await this.getRandomEmailByDifficulty(difficulty);

    const scheduledAts = this.resolveScheduledTimes(
      recipients.length,
      scheduledFrom,
      scheduledTo,
      randomisedTimes,
    );

    const dispatches: RecipientDispatch[] = recipients.map(
      (recipient, index) => ({
        recipient,
        referenceNumber,
        scheduledAt: scheduledAts[index],
      }),
    );

    return this.dispatchBatch(
      dispatches,
      `difficulty ${difficulty} (same template)`,
    );
  }

  async sendBatchRandomDifferentEmail(
    recipients: string[],
    difficulty: EmailDifficulty,
    scheduledFrom: Date,
    scheduledTo: Date,
    randomisedTimes: boolean,
  ): Promise<BatchSendResult> {
    // Makes sure scheduledFrom <= scheduledTo
    this.validateScheduleWindow(scheduledFrom, scheduledTo);

    const referenceNumberPool = await this.getRandomEmailByDifficultyArray(
      difficulty,
      recipients.length,
    );

    const referenceNumbers = this.buildRoundRobinReferenceNumbers(
      referenceNumberPool,
      recipients.length,
    );

    const scheduledAts = this.resolveScheduledTimes(
      recipients.length,
      scheduledFrom,
      scheduledTo,
      randomisedTimes,
    );

    const dispatches: RecipientDispatch[] = recipients.map(
      (recipient, index) => ({
        recipient,
        referenceNumber: referenceNumbers[index],
        scheduledAt: scheduledAts[index],
      }),
    );

    return this.dispatchBatch(
      dispatches,
      `difficulty ${difficulty} (different templates)`,
    );
  }

  async getRandomEmailByDifficulty(
    difficulty: EmailDifficulty,
  ): Promise<string> {
    const [referenceNumber] = await this.getRandomEmailByDifficultyArray(
      difficulty,
      1,
    );
    return referenceNumber;
  }

  async getRandomEmailByDifficultyArray(
    difficulty: EmailDifficulty,
    size: number,
  ): Promise<string[]> {
    let emails: Emails[];

    try {
      // Query Builder:
      // Get all email entries with the specific difficulty
      // Orders it as Random
      // Returns only the size needed
      emails = await this.emailRepository
        .createQueryBuilder('email')
        .where('email.difficulty = :difficulty', { difficulty })
        .orderBy('RANDOM()')
        .limit(size)
        .getMany();
    } catch (error) {
      this.logger.error(
        `Database execution failure when fetching email(s) of difficulty: ${difficulty}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch email with specific difficulty due to a system error',
      );
    }

    if (emails.length === 0) {
      this.logger.warn(
        `Lookup missed: no email(s) found with difficulty: ${difficulty}.`,
      );
      throw new NotFoundException(
        `No email(s) found with difficulty: ${difficulty}`,
      );
    }

    return emails.map((email) => email.referenceNumber);
  }

  private async dispatchBatch(
    dispatches: RecipientDispatch[],
    details: string,
  ): Promise<BatchSendResult> {
    const referenceNumbers = [
      ...new Set(dispatches.map((dispatch) => dispatch.referenceNumber)),
    ];

    const emailsByReference =
      await this.fetchEmailsByReferenceNumbers(referenceNumbers);

    const payload = dispatches.map((dispatch) =>
      this.buildResendItem(
        dispatch,
        emailsByReference.get(dispatch.referenceNumber),
      ),
    );

    await this.sendResendBatch(payload);

    this.logger.log(
      `Dispatched batch of ${dispatches.length} email(s) for ${details}`,
    );

    const routing = dispatches.every((dispatch) =>
      this.isImmediate(dispatch.scheduledAt),
    )
      ? 'mailing.batch_send'
      : 'mailing.batch_schedule';

    await this.publishBatchDispatchEvent(routing, dispatches);

    return {
      success: true,
      message: `${dispatches.length} email(s) dispatched for ${details}.`,
    };
  }

  private async fetchEmailsByReferenceNumbers(
    referenceNumbers: string[],
  ): Promise<Map<string, Emails>> {
    // Find all the email templates relative to their reference numbers
    const emails = await this.emailRepository.find({
      where: { referenceNumber: In(referenceNumbers) },
    });

    const referenceWithEmail = new Map(
      emails.map((email) => [email.referenceNumber, email]),
    );

    // Looking for any missing emails
    // Be advised that this code was autofilled but seems to work
    const missing = referenceNumbers.filter(
      (referenceNumber) => !referenceWithEmail.has(referenceNumber),
    );
    if (missing.length > 0) {
      throw new NotFoundException(
        `Email(s) not found for reference(s): ${missing.join(', ')}`,
      );
    }

    return referenceWithEmail;
  }

  // Event publishing for batch
  private async publishBatchDispatchEvent(
    routingKey: string,
    dispatches: RecipientDispatch[],
  ): Promise<void> {
    const entries = dispatches.map((dispatch) => ({
      recipient: dispatch.recipient,
      referenceNumber: dispatch.referenceNumber,
      scheduledAt: dispatch.scheduledAt.toISOString(),
    }));

    this.logger.log(
      `Publishing "${routingKey}" to "${MAILING_EVENT_EXCHANGE}"`,
    );

    try {
      await this.amqpConnection.publish(
        MAILING_EVENT_EXCHANGE,
        routingKey,
        {
          entries,
        },
        {
          mandatory: true,
        },
      );
      this.logger.log(`Published "${routingKey}" successfully`);
    } catch (publishError) {
      this.logger.error(`Failed to publish ${routingKey}`, publishError);
    }
  }

  private formatFromAddress(email: Emails): string {
    return email.alias ? `${email.alias} <${email.sender}>` : email.sender;
  }

  private isImmediate(scheduledAt: Date): boolean {
    return scheduledAt.getTime() - Date.now() <= 5 * 60 * 1000;
  }

  private validateScheduleWindow(scheduledFrom: Date, scheduledTo: Date): void {
    if (scheduledTo.getTime() < scheduledFrom.getTime()) {
      throw new BadRequestException(
        'scheduledTo must not be earlier than scheduledFrom',
      );
    }
  }

  private buildResendItem(
    dispatch: RecipientDispatch,
    email: Emails,
  ): ResendBatchItem {
    const item: ResendBatchItem = {
      from: this.formatFromAddress(email),
      to: [dispatch.recipient],
      subject: email.subject,
      html: email.content,
    };

    // Add scheduledAt field if the scheduledAt time is inside the 5-min time.
    if (!this.isImmediate(dispatch.scheduledAt)) {
      item.scheduledAt = dispatch.scheduledAt.toISOString();
    }

    return item;
  }

  private async sendResendBatch(payload: ResendBatchItem[]): Promise<void> {
    let error: { message?: string } | null | undefined;

    try {
      ({ error } = await this.resend.batch.send(payload));
    } catch (sendError) {
      this.logger.error('Resend batch API call failed', sendError);
      const diagnosticMessage =
        sendError instanceof Error
          ? sendError.message
          : 'Resend batch send failed';
      throw new InternalServerErrorException(diagnosticMessage);
    }

    if (error) {
      this.logger.error('Resend batch API returned an error', error);
      throw new InternalServerErrorException(
        error.message ?? 'Resend batch send failed',
      );
    }
  }

  /* We try to keep the structure: recipient, referenceNumber, scheduledAt for all emails sent even if the scheduledAt is now
   * We have 3 cases:
   * 1) All emails are sent at the same predefined time
   * 2) Emails are sent at random times
   * 3) All emails are sent at the same random time
   */
  private resolveScheduledTimes(
    count: number,
    scheduledFrom: Date,
    scheduledTo: Date,
    randomisedTimes: boolean,
  ): Date[] {
    const sameInstant = scheduledFrom.getTime() === scheduledTo.getTime();

    if (sameInstant) {
      return new Array<Date>(count).fill(scheduledFrom);
    }

    if (randomisedTimes) {
      return Array.from({ length: count }, () =>
        this.randomDateBetween(scheduledFrom, scheduledTo),
      );
    }

    const sharedTime = this.randomDateBetween(scheduledFrom, scheduledTo);
    return new Array<Date>(count).fill(sharedTime);
  }

  // We assign each recipient a random email available of the specific difficulty using round-robin
  private buildRoundRobinReferenceNumbers(
    pool: string[],
    count: number,
  ): string[] {
    const referenceNumbers: string[] = [];

    for (let index = 0; index < count; index++) {
      const poolIndex = index % pool.length;
      referenceNumbers.push(pool[poolIndex]);
    }

    return referenceNumbers;
  }

  private randomDateBetween(from: Date, to: Date): Date {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    const randomTime = crypto.randomInt(fromTime, toTime + 1);
    return new Date(randomTime);
  }
}
