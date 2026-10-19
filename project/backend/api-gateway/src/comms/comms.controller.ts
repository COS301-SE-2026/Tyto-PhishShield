import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

function authHeader(req: Request): Record<string, string> {
  const token = req.headers['authorization'];
  return token ? { Authorization: token } : {};
}

@ApiTags('Comms')
@Controller('comms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommsController {
  private readonly commsServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.commsServiceUrl = this.config.get<string>(
      'COMMS_SERVICE_URL',
      'http://localhost:3008',
    );
  }

  @Get('graph')
  @UseGuards(RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({
    summary: 'Directed communication graph for the admin dashboard',
  })
  @ApiQuery({ name: 'period', required: false, example: '30d' })
  getGraph(@Req() req: AuthenticatedRequest, @Query('period') period?: string) {
    const qs = period ? `?period=${period}` : '';
    return this.proxy.forward({
      url: `${this.commsServiceUrl}/api/comms/graph${qs}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('messages')
  @UseGuards(RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({
    summary: 'Recent recorded messages with content (admin/analyst only)',
  })
  @ApiQuery({ name: 'limit', required: false, example: '50' })
  @ApiQuery({ name: 'senderAuth0Id', required: false })
  @ApiQuery({ name: 'receiverAuth0Id', required: false })
  @ApiQuery({ name: 'sinceDays', required: false, example: '30' })
  getMessages(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('senderAuth0Id') senderAuth0Id?: string,
    @Query('receiverAuth0Id') receiverAuth0Id?: string,
    @Query('sinceDays') sinceDays?: string,
  ) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (senderAuth0Id) params.set('senderAuth0Id', senderAuth0Id);
    if (receiverAuth0Id) params.set('receiverAuth0Id', receiverAuth0Id);
    if (sinceDays) params.set('sinceDays', sinceDays);
    const qs = params.toString() ? `?${params.toString()}` : '';

    return this.proxy.forward({
      url: `${this.commsServiceUrl}/api/comms/messages${qs}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }
}
