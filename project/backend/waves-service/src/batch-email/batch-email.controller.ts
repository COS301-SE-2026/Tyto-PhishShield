/**
 * Service: waves-service
 *
 * Handles incoming HTTP requests for batch email operations.
 * Exposes REST endpoints for sending a single email template to multiple
 * recipients, or dispatching randomized emails drawn by difficulty.
 *
 * Functions:
 * - {@link BatchEmailController#sendBatchWithReference} - Sends one email template to a list of recipients using a reference number.
 * - {@link BatchEmailController#sendBatchRandom} - Sends the same randomly selected email (by difficulty) to all recipients.
 * - {@link BatchEmailController#sendBatchRandomDifferentEmail} - Sends a different randomly selected email (by difficulty) to each recipient.
 */

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BatchEmailService } from './batch-email.service';
import { BatchPostReturnDto } from '../dto/batch-post-return.dto';
import { SendBatchRandomDto } from '../dto/send-batch-random.dto';
import { SendBatchDto } from '../dto/send-batch.dto';

@Controller('batch-emails')
export class BatchEmailController {
  constructor(private readonly batchEmailService: BatchEmailService) {}

  @Post('send-batch-random-same-email')
  @HttpCode(HttpStatus.OK)
  async sendBatchRandom(
    @Body() sendBatchRandom: SendBatchDto,
  ): Promise<BatchPostReturnDto> {
    const result = await this.batchEmailService.sendBatchRandomSameEmail(
      sendBatchRandom.auth0Id,
      sendBatchRandom.difficulty,
      sendBatchRandom.scheduledFrom,
      sendBatchRandom.scheduledTo,
      sendBatchRandom.randomisedTimes,
      sendBatchRandom.waveName,
      sendBatchRandom.referenceNumber,
    );

    return new BatchPostReturnDto({
      success: result.success,
      message: result.message,
    });
  }

  @Post('send-batch-random-different-email')
  @HttpCode(HttpStatus.OK)
  async sendBatchRandomDifferentEmail(
    @Body() sendBatchRandom: SendBatchRandomDto,
  ): Promise<BatchPostReturnDto> {
    const result = await this.batchEmailService.sendBatchRandomDifferentEmail(
      sendBatchRandom.auth0Id,
      sendBatchRandom.difficulty,
      sendBatchRandom.scheduledFrom,
      sendBatchRandom.scheduledTo,
      sendBatchRandom.randomisedTimes,
      sendBatchRandom.waveName,
    );

    return new BatchPostReturnDto({
      success: result.success,
      message: result.message,
    });
  }
}
