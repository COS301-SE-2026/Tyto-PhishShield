import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { BatchEmailService } from './batch-email.service';
import { SendBatchEmailDto } from '../dto/send-batch-email.dto';
import { BatchPostReturnDto } from '../dto/batch-post-return.dto';
import { SendBatchRandomDto } from '../dto/send-batch-random.dto';

@Controller('batch-emails')
export class BatchEmailController {
  constructor(private readonly batchEmailService: BatchEmailService) {}

  @Post(':referenceNumber/send-batch-with-reference')
  @HttpCode(HttpStatus.OK)
  async sendBatchWithReference(
    @Param('referenceNumber') referenceNumber: string,
    @Body() sendBatchEmail: SendBatchEmailDto,
  ): Promise<BatchPostReturnDto> {
    const result = await this.batchEmailService.sendBatchWithReference(
      referenceNumber,
      sendBatchEmail.recipients,
    );

    return new BatchPostReturnDto({
      success: result.success,
      message: result.message,
    });
  }

  @Post('send-batch-random-same-email')
  @HttpCode(HttpStatus.OK)
  async sendBatchRandom(
    @Body() sendBatchRandom: SendBatchRandomDto,
  ): Promise<BatchPostReturnDto> {
    const result = await this.batchEmailService.sendBatchRandomSameEmail(
      sendBatchRandom.recipients,
      sendBatchRandom.difficulty,
      sendBatchRandom.scheduledFrom,
      sendBatchRandom.scheduledTo,
      sendBatchRandom.randomisedTimes,
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
      sendBatchRandom.recipients,
      sendBatchRandom.difficulty,
      sendBatchRandom.scheduledFrom,
      sendBatchRandom.scheduledTo,
      sendBatchRandom.randomisedTimes,
    );

    return new BatchPostReturnDto({
      success: result.success,
      message: result.message,
    });
  }
}
