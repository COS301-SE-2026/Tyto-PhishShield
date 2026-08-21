/**
 * Service: api-gateway
 *
 * Proxies incoming HTTP requests for XP operations to the xp-service.
 * Validates JWT authentication and forwards each request via ProxyService.
 *
 * Functions:
 * - {@link XpController#giveXp} - Forwards a request to award XP to a user.
 * - {@link XpController#getAllXp} - Forwards a request to retrieve all XP records.
 * - {@link XpController#getNetXpAllUsers} - Forwards a request to retrieve the global XP leaderboard.
 * - {@link XpController#getXpByUser} - Forwards a lookup request for a single user's XP history.
 * - {@link XpController#getNetXpByUser} - Forwards a request to calculate a single user's total XP.
 */

import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import {
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GiveXpDto } from './dto/give-xp.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('XP')
@Controller('xp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class XpController {
  private readonly xpServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.xpServiceUrl = this.config.get<string>(
      'XP_SERVICE_URL',
      'http://localhost:3005',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Award XP to a user' })
  @ApiBody({ type: GiveXpDto })
  giveXp(@Body() body: GiveXpDto) {
    return this.proxy.forward({
      url: `${this.xpServiceUrl}/xp`,
      method: 'POST',
      data: body,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all XP records across the system' })
  getAllXp() {
    return this.proxy.forward({
      url: `${this.xpServiceUrl}/xp`,
      method: 'GET',
    });
  }

  @Get('net')
  @ApiOperation({
    summary: 'Retrieve aggregated net XP leaderboard for all users',
  })
  getNetXpAllUsers() {
    return this.proxy.forward({
      url: `${this.xpServiceUrl}/xp/net`,
      method: 'GET',
    });
  }

  @Get(':auth0Id')
  @ApiOperation({
    summary: 'Get all individual XP records for a specific user',
  })
  @ApiParam({ name: 'auth0Id', type: 'string', example: 'auth0|123456789' })
  getXpByUser(@Param('auth0Id') auth0Id: string) {
    return this.proxy.forward({
      url: `${this.xpServiceUrl}/xp/${auth0Id}`,
      method: 'GET',
    });
  }

  @Get(':auth0Id/net')
  @ApiOperation({ summary: 'Get the total accumulated XP for a specific user' })
  @ApiParam({ name: 'auth0Id', type: 'string', example: 'auth0|123456789' })
  getNetXpByUser(@Param('auth0Id') auth0Id: string) {
    return this.proxy.forward({
      url: `${this.xpServiceUrl}/xp/${auth0Id}/net`,
      method: 'GET',
    });
  }

  @Public()
  @Post('link-clicked')
  @ApiOperation({ summary: 'Marks link as clicked and deducts xp from user' })
  @ApiBody({
    schema: { example: { token: 'ABC123' } },
  })
  linkClicked(
    @Body() token: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.proxy.forward({
      url: `${this.xpServiceUrl}/xp/link-clicked`,
      method: 'POST',
      data: token,
    });
  }
}
