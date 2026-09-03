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
import {
  EmailDifficulty,
  EmailTemplateEntity,
} from '../entities/email-template.entity';
import { In, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UserEntity } from '../entities/user.entity';
import { BatchSendResultDto } from '../dto/batch-send-result.dto';
import { ResendBatchItemDto } from '../dto/resend-batch-item.dto';
import { BatchRecipientDto } from '../dto/batch-recipient.dto';
import { WaveService } from '../wave/wave.service';

const MAILING_EVENT_EXCHANGE = 'mailing-event-exchange';

// To find variables marked as {{_}}
const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

@Injectable()
export class BatchEmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(BatchEmailService.name);
  private readonly businessName: string;
  private readonly trackingLink: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(EmailTemplateEntity)
    private readonly emailTemplateRepository: Repository<EmailTemplateEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly waveService: WaveService,
    private readonly amqpConnection: AmqpConnection,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.businessName = this.configService.get<string>(
      'BUSINESS_NAME',
      'FiveGuys',
    );
    this.trackingLink = this.configService.get<string>(
      'TRACKING_LINK',
      'http://localhost:5050',
    );
  }

  async sendBatchWithReference(
    referenceNumber: string,
    auth0Ids: string[],
  ): Promise<BatchSendResultDto> {
    const now = new Date();

    const dispatches: BatchRecipientDto[] = auth0Ids.map((auth0Id) => ({
      auth0Id,
      referenceNumber: referenceNumber,
      scheduledAt: now,
    }));

    const { emailsIds, tokens, recipientEmails } = await this.sendEmails(
      dispatches,
      `reference ${referenceNumber}`,
    );

    await this.publishBatchDispatchEvent(
      this.routingKey(dispatches),
      dispatches,
      emailsIds,
      tokens,
      undefined,
      recipientEmails,
    );

    return {
      success: true,
      message: `Successfully dispatched ${dispatches.length} email(s) with reference ${referenceNumber}.`,
    };
  }

  async sendBatchRandomSameEmail(
    auth0Ids: string[],
    difficulty: EmailDifficulty,
    scheduledFrom: Date,
    scheduledTo: Date,
    randomisedTimes: boolean,
    waveName: string,
    referenceNumber: string,
  ): Promise<BatchSendResultDto> {
    // Makes sure scheduledFrom <= scheduledTo
    this.validateScheduleWindow(scheduledFrom, scheduledTo);

    if (!referenceNumber) {
      referenceNumber = await this.getRandomEmailByDifficulty(difficulty);
    }

    const scheduledAts = this.resolveScheduledTimes(
      auth0Ids.length,
      scheduledFrom,
      scheduledTo,
      randomisedTimes,
    );

    const dispatches: BatchRecipientDto[] = auth0Ids.map((auth0Id, index) => ({
      auth0Id,
      referenceNumber,
      scheduledAt: scheduledAts[index],
    }));

    return this.dispatchBatch(
      dispatches,
      `difficulty ${difficulty} (same template)`,
      {
        waveName,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        sameEmail: true,
        randomisedTimes,
      },
    );
  }

  async sendBatchRandomDifferentEmail(
    auth0Ids: string[],
    difficulty: EmailDifficulty,
    scheduledFrom: Date,
    scheduledTo: Date,
    randomisedTimes: boolean,
    waveName: string,
  ): Promise<BatchSendResultDto> {
    // Makes sure scheduledFrom <= scheduledTo
    this.validateScheduleWindow(scheduledFrom, scheduledTo);

    const referenceNumberPool = await this.getRandomEmailByDifficultyArray(
      difficulty,
      auth0Ids.length,
    );

    const referenceNumbers = this.buildRoundRobinReferenceNumbers(
      referenceNumberPool,
      auth0Ids.length,
    );

    const scheduledAts = this.resolveScheduledTimes(
      auth0Ids.length,
      scheduledFrom,
      scheduledTo,
      randomisedTimes,
    );

    const dispatches: BatchRecipientDto[] = auth0Ids.map((auth0Id, index) => ({
      auth0Id,
      referenceNumber: referenceNumbers[index],
      scheduledAt: scheduledAts[index],
    }));

    return this.dispatchBatch(
      dispatches,
      `difficulty ${difficulty} (different templates)`,
      {
        waveName,
        scheduledFrom: scheduledFrom.toISOString(),
        scheduledTo: scheduledTo.toISOString(),
        sameEmail: false,
        randomisedTimes,
      },
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
    let emails: EmailTemplateEntity[];

    try {
      // Query Builder:
      // Get all email entries with the specific difficulty
      // Orders it as Random
      // Returns only the size needed
      emails = await this.emailTemplateRepository
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
    dispatches: BatchRecipientDto[],
    details: string,
    waveInfo: {
      waveName: string;
      scheduledFrom: string;
      scheduledTo: string;
      sameEmail: boolean;
      randomisedTimes: boolean;
    },
  ): Promise<BatchSendResultDto> {
    const { emailsIds, tokens, recipientEmails } = await this.sendEmails(
      dispatches,
      details,
    );

    let waveId: string | undefined;

    try {
      const wave = await this.waveService.saveWave({
        waveName: waveInfo.waveName,
        scheduledFrom: waveInfo.scheduledFrom,
        scheduledTo: waveInfo.scheduledTo,
        sameEmail: waveInfo.sameEmail,
        randomisedTimes: waveInfo.randomisedTimes,
        recipients: dispatches.map((dispatch, index) => ({
          auth0Id: dispatch.auth0Id,
          referenceNumber: dispatch.referenceNumber,
          emailId: emailsIds[index],
          scheduledAt: dispatch.scheduledAt,
        })),
      });
      waveId = wave.id;
    } catch (error) {
      this.logger.error(
        `Failed to save wave record "${waveInfo.waveName}" after send`,
        error,
      );
    }

    await this.publishBatchDispatchEvent(
      this.routingKey(dispatches),
      dispatches,
      emailsIds,
      tokens,
      waveId,
      recipientEmails,
    );

    return {
      success: true,
      message: `${dispatches.length} email(s) dispatched for ${details}.`,
    };
  }

  private async sendEmails(
    dispatches: BatchRecipientDto[],
    details: string,
  ): Promise<{
    emailsIds: string[];
    tokens: string[];
    recipientEmails: string[];
  }> {
    const referenceNumbers = [
      ...new Set(dispatches.map((dispatch) => dispatch.referenceNumber)),
    ];

    const emailsByReference =
      await this.fetchEmailsByReferenceNumbers(referenceNumbers);

    const auth0Ids = [
      ...new Set(dispatches.map((dispatch) => dispatch.auth0Id)),
    ];

    const recipients = await this.userRepository.find({
      where: { auth0Id: In(auth0Ids) },
    });

    const recipientMap = new Map(
      recipients.map((recipient) => [recipient.auth0Id, recipient]),
    );

    const built = dispatches.map((dispatch) =>
      this.buildResendItem(
        dispatch,
        emailsByReference.get(dispatch.referenceNumber),
        recipientMap.get(dispatch.auth0Id),
      ),
    );

    const payload = built.map((item) => item.dto);
    const tokens = built.map((item) => item.token);

    const emailsIds = await this.sendResendBatch(payload);
    const recipientEmails = dispatches.map(
      (dispatch) => recipientMap.get(dispatch.auth0Id)?.email ?? '',
    );

    this.logger.log(
      `Dispatched batch of ${dispatches.length} email(s) for ${details}`,
    );

    return { emailsIds, tokens, recipientEmails };
  }

  private routingKey(dispatches: BatchRecipientDto[]): string {
    return dispatches.every((dispatch) =>
      this.isImmediate(dispatch.scheduledAt),
    )
      ? 'mailing.batch_send'
      : 'mailing.batch_schedule';
  }

  private async fetchEmailsByReferenceNumbers(
    referenceNumbers: string[],
  ): Promise<Map<string, EmailTemplateEntity>> {
    // Find all the email templates relative to their reference numbers
    const emails = await this.emailTemplateRepository.find({
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
    dispatches: BatchRecipientDto[],
    emailIds: string[],
    tokens: string[],
    waveId?: string,
    recipientEmails?: string[],
  ): Promise<void> {
    const entries = dispatches.map((dispatch, index) => ({
      auth0Id: dispatch.auth0Id,
      referenceNumber: dispatch.referenceNumber,
      scheduledAt: dispatch.scheduledAt.toISOString(),
      emailId: emailIds[index],
      token: tokens[index],
      recipient: recipientEmails?.[index] ?? undefined,
      ...(waveId ? { waveId } : {}),
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

  private formatFromAddress(email: EmailTemplateEntity): string {
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
    dispatch: BatchRecipientDto,
    email: EmailTemplateEntity,
    user?: UserEntity,
  ): { dto: ResendBatchItemDto; token: string } {
    try {
      if (!user) {
        throw new NotFoundException(
          `User not found for Auth0Id: ${dispatch.auth0Id}`,
        );
      }

      const { subject, content, token } = this.formatEmailContent(email, user);

      const item: ResendBatchItemDto = {
        from: this.formatFromAddress(email),
        to: [user.email],
        subject,
        html: content,
      };

      // Add scheduledAt field if the scheduledAt time is outside the 5-min time.
      if (!this.isImmediate(dispatch.scheduledAt)) {
        item.scheduledAt = dispatch.scheduledAt.toISOString();
      }

      return { dto: item, token };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find user: ${dispatch.auth0Id}`);
      throw new InternalServerErrorException(error);
    }
  }

  private formatEmailContent(
    email: EmailTemplateEntity,
    user: UserEntity,
  ): { subject: string; content: string; token: string } {
    let subject: string = email.subject;
    let content_text: string = email.content;

    if (
      email.difficulty === EmailDifficulty.MEDIUM ||
      email.difficulty === EmailDifficulty.EASY
    ) {
      subject = this.replaceMediumVariables(email.subject, user);
      content_text = this.replaceMediumVariables(email.content, user);
    } else if (email.difficulty === EmailDifficulty.HARD) {
      subject = this.replaceHardVariables(email.subject, user);
      content_text = this.replaceHardVariables(email.content, user);
    }

    const { content, token } = this.replaceTrackingLinkVariables(content_text);

    this.checkForExtraVariables(email.referenceNumber, subject, content);

    return { subject, content, token };
  }

  private replaceTrackingLinkVariables(content: string): {
    content: string;
    token: string;
  } {
    let returning = content;

    const trackingToken = crypto.randomBytes(6).toString('hex').toUpperCase();
    returning = returning.replace(
      /{{\s*tracking_link\s*}}/g,
      this.trackingLink + `/${trackingToken}`,
    );

    return { content: returning, token: trackingToken };
  }

  private replaceMediumVariables(text: string, user: UserEntity): string {
    if (!text) {
      return text;
    }

    let returning = text;

    if (user.name) {
      const firstName: string = user.name.split(' ')[0];
      returning = returning.replace(/{{\s*name\s*}}/g, firstName);
    }

    if (user.department) {
      returning = returning.replace(/{{\s*department\s*}}/g, user.department);
    }

    if (this.businessName) {
      returning = returning.replace(
        /{{\s*business_name\s*}}/g,
        this.businessName,
      );
    }

    return returning;
  }

  private replaceHardVariables(text: string, user: UserEntity): string {
    if (!text) {
      return text;
    }

    let returning = text;

    if (user.name) {
      const firstName: string = user.name.split(' ')[0];
      returning = returning.replace(/{{\s*name\s*}}/g, firstName);
    }

    if (user.department) {
      returning = returning.replace(/{{\s*department\s*}}/g, user.department);
    }

    if (this.businessName) {
      returning = returning.replace(
        /{{\s*business_name\s*}}/g,
        this.businessName,
      );
    }

    return returning;
  }

  private checkForExtraVariables(
    referenceNumber: string,
    subject: string,
    content: string,
  ): void {
    const extraVariables = new Set<string>();

    for (const text of [subject, content]) {
      VARIABLE_PATTERN.lastIndex = 0;

      let match: RegExpExecArray | null;

      while ((match = VARIABLE_PATTERN.exec(text)) !== null) {
        extraVariables.add(match[1]);
      }
    }

    if (extraVariables.size > 0) {
      const variableList = [...extraVariables].join(', ');
      this.logger.error(
        `Template "${referenceNumber}" has extra variable(s): ${variableList}`,
      );
      throw new InternalServerErrorException(
        `Template "${referenceNumber}" contains extra variable(s): ${variableList}`,
      );
    }
  }

  private async sendResendBatch(
    payload: ResendBatchItemDto[],
  ): Promise<string[]> {
    try {
      const { data, error } = await this.resend.batch.send(payload);
      if (error) {
        this.logger.error('Resend batch API returned an error', error);
        throw new InternalServerErrorException(
          error.message ?? 'Resend batch send failed',
        );
      }
      const emailIds: string[] = data.data.map((item) => item.id);

      if (emailIds.length !== payload.length) {
        this.logger.warn(
          `emailIds do not align with the amount of recipients. Event published is incorrect`,
        );
      }

      return emailIds;
    } catch (error) {
      this.logger.error('Resend batch API call failed', error);
      const diagnosticMessage =
        error instanceof Error ? error.message : 'Resend batch send failed';
      throw new InternalServerErrorException(diagnosticMessage);
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
