import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { LlmService } from './llm.service';
import { DifficultyLlmGenerationDto } from './dto/difficulty-llm-generation.dto';
import { GeneratedTemplatesResponseDto } from './dto/generated-templates-response.dto';
import { ClassifyReplyDto } from './dto/classify-reply.dto';
import { ReplyClassificationDto } from './dto/reply-classification.dto';
import { ClassificationService } from './classification/classification.service';
import { ReceivedReplyDto, ReplyValidatedEvent } from '@phishshield/dto';
import { ReplyGuardService } from './reply-guard/reply-guard.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Controller('llm')
export class LlmController {
  private readonly logger = new Logger(LlmController.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly classificationService: ClassificationService,
    private readonly replyGuardService: ReplyGuardService,
  ) {}

  @RabbitSubscribe({
    exchange: 'llm-event-exchange',
    routingKey: 'reply.valid',
    queue: 'llm-review-resolution-queue',
  })
  async handleReplyValidated(event: ReplyValidatedEvent): Promise<void> {
    await this.llmService.handleReplyValidated(event);
  }

  @Post('difficulty_generation')
  @HttpCode(HttpStatus.OK)
  async difficultyGeneration(
    @Body() body: DifficultyLlmGenerationDto,
  ): Promise<GeneratedTemplatesResponseDto> {
    return this.llmService.generateTemplates(body);
  }

  @Post('classify_reply')
  @HttpCode(HttpStatus.OK)
  async classifyReply(
    @Body() body: ClassifyReplyDto,
  ): Promise<ReplyClassificationDto> {
    return this.classificationService.classify(body);
  }

  @Post('received_reply')
  @HttpCode(HttpStatus.ACCEPTED)
  receivedReply(@Body() body: ReceivedReplyDto): { accepted: true } {
    this.logger.warn(`body in llm gateway: `, body);
    if (!this.replyGuardService.claimEvent(body.webhookEventId)) {
      this.logger.warn(
        `Duplicate webhook event ${body.webhookEventId} ignored`,
      );
      return { accepted: true };
    }
    void this.llmService.processReceivedReply(body).catch((err) => {
      this.logger.error(
        `Processing reply for email ${body.emailId} failed: ${err}`,
      );
    });

    return { accepted: true };
  }
}
