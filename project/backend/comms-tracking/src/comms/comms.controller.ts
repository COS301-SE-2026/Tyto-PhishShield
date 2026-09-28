import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommsService } from './comms.service';
import { CommsSource } from './entities/communication.entity';

@ApiTags('Comms')
@Controller('comms')
export class CommsController {
  constructor(private readonly commsService: CommsService) {}

  @Get('graph')
  @ApiOperation({ summary: 'Directed communication graph for the dashboard' })
  @ApiQuery({ name: 'period', required: false, example: '30d' })
  getGraph(@Query('period') period?: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    return this.commsService.getGraph(days);
  }

  @Get('messages')
  @ApiOperation({
    summary: 'Recent messages with content (for spear-phishing analysis)',
  })
  @ApiQuery({ name: 'limit', required: false, example: '50' })
  @ApiQuery({ name: 'senderAuth0Id', required: false })
  @ApiQuery({ name: 'receiverAuth0Id', required: false })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['slack', 'teams', 'email'],
  })
  @ApiQuery({ name: 'sinceDays', required: false, example: '30' })
  getMessages(
    @Query('limit') limit?: string,
    @Query('senderAuth0Id') senderAuth0Id?: string,
    @Query('receiverAuth0Id') receiverAuth0Id?: string,
    @Query('source') source?: string,
    @Query('sinceDays') sinceDays?: string,
  ) {
    const lim = Math.min(Number.parseInt(limit ?? '50', 10) || 50, 500);
    const days = sinceDays ? Number.parseInt(sinceDays, 10) : undefined;

    return this.commsService.getMessages({
      limit: lim,
      senderAuth0Id: senderAuth0Id || undefined,
      receiverAuth0Id: receiverAuth0Id || undefined,
      source: source as CommsSource | undefined,
      sinceDays: Number.isFinite(days) ? days : undefined,
    });
  }
}
