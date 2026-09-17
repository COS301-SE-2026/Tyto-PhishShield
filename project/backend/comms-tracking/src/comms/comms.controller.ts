import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommsService } from './comms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@phishshield/dto';

@ApiTags('Comms')
@Controller('comms')
export class CommsController {
  constructor(private readonly commsService: CommsService) {}

  @Get('graph')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Directed communication graph for the dashboard' })
  @ApiQuery({ name: 'period', required: false, example: '30d' })
  getGraph(@Query('period') period?: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    return this.commsService.getGraph(days);
  }
}