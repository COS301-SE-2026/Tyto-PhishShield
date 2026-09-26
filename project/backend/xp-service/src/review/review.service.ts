import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ReviewEntity, ReviewResolution } from '../entities/review.entity';
import { ReviewDecision } from '../dto/resolve-review.dto';
import {
  ReviewAttachmentLinkDto,
  ReviewListItemDto,
} from '../dto/review-list-item.dto';
import {
  ReplyEmailKind,
  ReplyValidatedEvent,
  ReviewNeededEvent,
  SendReplyEmailEvent,
  Severity,
} from '@phishshield/dto';
import { UserEntity } from '../entities/user.entity';
import { XpService } from '../xp/xp.service';
import { XpReason } from '../entities/xp.entity';

const SEVERITY_XP_PENALTY: Record<Severity, number> = {
  [Severity.NONE]: 0,
  [Severity.LOW]: -5,
  [Severity.MEDIUM]: -15,
  [Severity.HIGH]: -20,
  [Severity.CRITICAL]: -30,
};

@Injectable()
export class ReviewService {
  private readonly resend: Resend;
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly config: ConfigService,
    private readonly amqpConnection: AmqpConnection,
    private readonly xpService: XpService,
  ) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
  }

  async handleReviewNeeded(event: ReviewNeededEvent): Promise<void> {
    const review = this.reviewRepository.create({
      emailId: event.emailId,
      messageId: event.messageId,
      reviewType: event.reviewType,
      sender: event.sender,
      businessAddress: event.businessAddress,
      subject: event.subject,
      replyBody: event.replyBody,
      quotedText: event.quotedText,
      inReplyTo: event.inReplyTo,
      references: event.references,
      attachments: event.attachments,
      categories: event.categories,
      severity: event.severity,
      confidence: event.confidence,
      resolved: false,
    });

    await this.reviewRepository.save(review);
    this.logger.log(`Saved review entry for email ${event.emailId}`);
  }

  async getAllReviews(): Promise<ReviewListItemDto[]> {
    const reviews = await this.reviewRepository.find({
      where: { resolved: false },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(reviews.map((review) => this.toListItem(review)));
  }

  private async toListItem(review: ReviewEntity): Promise<ReviewListItemDto> {
    const [user, attachments] = await Promise.all([
      this.resolveUser(review.sender),
      this.resolveAttachmentLinks(review),
    ]);

    return {
      id: review.id,
      reviewType: review.reviewType,
      user,
      subject: review.subject,
      body: review.replyBody,
      attachments,
      categories: review.categories,
      severity: review.severity,
      confidence: review.confidence,
      createdAt: review.createdAt,
    };
  }

  private async resolveUser(senderEmail: string) {
    const user = await this.userRepository.findOne({
      where: { email: senderEmail },
    });
    if (!user) return null;

    return {
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      department: user.department,
    };
  }

  private async resolveAttachmentLinks(
    review: ReviewEntity,
  ): Promise<ReviewAttachmentLinkDto[]> {
    if (!review.attachments?.length) return [];

    const results = await Promise.allSettled(
      review.attachments.map(async (attachment) => {
        const { data, error } = await this.resend.emails.attachments.get({
          id: attachment.id,
          emailId: review.emailId,
        });

        if (error || !data) throw new Error(error?.message ?? 'no data');

        return {
          id: data.id,
          filename: data.filename,
          size: data.size,
          contentType: data.content_type,
          downloadUrl: data.download_url,
          expiresAt: data.expires_at,
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<ReviewAttachmentLinkDto> => {
        if (r.status === 'rejected') {
          this.logger.warn(
            `Failed to resolve attachment link for email ${review.emailId}`,
            r.reason,
          );
        }
        return r.status === 'fulfilled';
      })
      .map((r) => r.value);
  }

  async resolve(id: string, decision: ReviewDecision): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException(`Review ${id} not found`);

    if (decision === ReviewDecision.LEAK) {
      await this.handleLeak(review);
    } else {
      await this.handleNoLeak(review);
    }

    review.resolved = true;
    review.resolution =
      decision === ReviewDecision.LEAK
        ? ReviewResolution.LEAK
        : ReviewResolution.NO_LEAK;
    review.resolvedAt = new Date();

    return this.reviewRepository.save(review);
  }

  private async handleLeak(review: ReviewEntity): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: review.sender },
    });

    if (user) {
      const penalty = review.severity
        ? SEVERITY_XP_PENALTY[review.severity]
        : 0;
      await this.xpService.giveXp({
        auth0Id: user.auth0Id,
        amount: penalty,
        reason: XpReason.COMPROMISED,
      });
    } else {
      this.logger.warn(
        `Could not resolve user for ${review.sender}, skipping XP deduction`,
      );
    }

    const mailingPayload: SendReplyEmailEvent = {
      kind: ReplyEmailKind.FAILED_DEFAULT,
      emailId: review.emailId,
      to: review.sender,
      from: review.businessAddress,
      originalSubject: review.subject,
      inReplyTo: review.messageId,
      references: [...review.references, review.messageId].filter(
        (r): r is string => !!r,
      ),
    };

    await this.amqpConnection.publish(
      'llm-event-exchange',
      'reply.email',
      mailingPayload,
    );
  }

  private async handleNoLeak(review: ReviewEntity): Promise<void> {
    const validatedPayload: ReplyValidatedEvent = {
      emailId: review.emailId,
      messageId: review.messageId,
      from: review.sender,
      to: review.businessAddress,
      subject: review.subject,
      replyText: review.replyBody ?? '',
      quotedText: review.quotedText ?? '',
      inReplyTo: review.inReplyTo,
      references: review.references,
    };

    await this.amqpConnection.publish(
      'llm-event-exchange',
      'reply.valid',
      validatedPayload,
    );
  }

  async delete(id: string): Promise<void> {
    const result = await this.reviewRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Review ${id} not found`);
    }
  }
}
