import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { ResolveReviewDto } from '../dto/resolve-review.dto';
import { ReviewListItemDto } from '../dto/review-list-item.dto';
import { ReviewEntity } from '../entities/review.entity';
import { ReviewNeededEvent } from '@phishshield/dto';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @RabbitSubscribe({
    exchange: 'llm-event-exchange',
    routingKey: 'reply.review',
    queue: 'xp-review-queue',
  })
  async handleReviewNeeded(event: ReviewNeededEvent): Promise<void> {
    await this.reviewService.handleReviewNeeded(event);
  }

  @Get()
  async getAll(): Promise<ReviewListItemDto[]> {
    return this.reviewService.getAllReviews();
  }

  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReviewDto,
  ): Promise<ReviewEntity> {
    return this.reviewService.resolve(id, dto.decision);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.reviewService.delete(id);
    return { deleted: true };
  }
}
