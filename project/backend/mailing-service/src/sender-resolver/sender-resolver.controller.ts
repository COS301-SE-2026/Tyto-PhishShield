import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Query,
} from '@nestjs/common';
import { SenderResolverService } from './sender-resolver.service';
import { Department, SenderRecommendation } from '@phishshield/dto';

@Controller('sender-resolver')
export class SenderResolverController {
  constructor(private readonly senderResolver: SenderResolverService) {}

  @Get('recommendations/:recipientAuth0Id')
  async getRecommendations(
    @Param('recipientAuth0Id') recipientAuth0Id: string,
    @Query('department', new ParseEnumPipe(Department, { optional: true }))
    department?: Department,
  ): Promise<SenderRecommendation[]> {
    return this.senderResolver.getRecommendedSenders(
      recipientAuth0Id,
      department,
    );
  }
}
