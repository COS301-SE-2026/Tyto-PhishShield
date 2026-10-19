import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Query,
} from '@nestjs/common';
import {
  AvailableVariables,
  SenderResolverService,
} from './sender-resolver.service';
import { Department, SenderRecommendation } from '@phishshield/dto';

@Controller('sender-resolver')
export class SenderResolverController {
  constructor(private readonly senderResolver: SenderResolverService) {}

  @Get('available-variables')
  async getAvailableVariables(
    @Query('senderAuth0Id') senderAuth0Id: string,
    @Query('recipientAuth0Id') recipientAuth0Id: string,
  ): Promise<AvailableVariables> {
    return this.senderResolver.getAvailableVariables(
      senderAuth0Id,
      recipientAuth0Id,
    );
  }

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
