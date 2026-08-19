import { Controller, Get, Req, UseGuards, Query, Param } from '@nestjs/common';
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

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly analyticsServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.analyticsServiceUrl = this.config.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://localhost:3006',
    );
  }

  @Get('Overview')
  @ApiOperation({
    summary: 'Top-level stats for the admin dashboard',
  })
  getOverview(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/api/analytics/overview`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('reports')
  @UseGuards(RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Report statistcs within optional date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getReportStats(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const qs = this.buildQuery({ from, to });
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/api/analytics/reports${qs}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('mailing')
  @UseGuards(RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Mailing statistcs within optional date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getMailingStats(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const qs = this.buildQuery({ from, to });
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/api/analytics/mailing${qs}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('timeseries')
  @UseGuards(RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Time series data for charts' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getTimeSeries(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const qs = this.buildQuery({ from, to });
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/api/analytics/timeseries${qs}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('leaderboard')
  @UseGuards(RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Top users by XP' })
  @ApiQuery({ name: 'limit', required: false })
  getLeaderboard(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    const qs = this.buildQuery({ limit });
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/api/analytics/leaderboard${qs}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('users/:auth0Id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Per-user analytics' })
  getUserStats(
    @Req() req: AuthenticatedRequest,
    @Param('auth0Id') auth0Id: string,
  ) {
    return this.proxy.forward({
      url: `${this.analyticsServiceUrl}/api/analytics/users/${auth0Id}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  private buildQuery(params: Record<string, string | undefined>): string {
    const defined = Object.entries(params).filter(([, v]) => v !== undefined);
    if (defined.length === 0) return '';
    const sp = new URLSearchParams(defined as [string, string][]);
    return `?${sp.toString()}`;
  }
}
