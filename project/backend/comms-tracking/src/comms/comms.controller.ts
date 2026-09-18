import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommsService } from './comms.service';

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
}