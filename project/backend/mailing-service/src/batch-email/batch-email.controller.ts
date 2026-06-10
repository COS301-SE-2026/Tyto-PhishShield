import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BatchEmailService } from './batch-email.service';
import { SendBatchEmailDto } from '../dto/send-batch-email.dto';
import { BatchPostReturnDto } from '../dto/batch-post-return.dto';

@Controller('batch-email')
export class BatchEmailController {
  constructor(private readonly batchEmailService: BatchEmailService) {}

  @Post('send-batch-with-reference')
  @HttpCode(HttpStatus.OK)
  async sendBatchWithReference(
    @Body() sendBatchEmail: SendBatchEmailDto,
  ): Promise<BatchPostReturnDto> {
    const result = await this.batchEmailService.sendBatchWithReference(
      sendBatchEmail.emailReferenceNumber,
      sendBatchEmail.recipients,
    );

    return new BatchPostReturnDto({
      success: result.success,
      message: result.message,
    });
  }
}
