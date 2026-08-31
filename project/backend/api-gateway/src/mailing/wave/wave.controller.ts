/**
 * Service: api-gateway
 *
 * Proxies incoming HTTP requests for wave operations to the waves-service.
 * Validates JWT authentication and forwards each request via ProxyService.
 *
 * Functions:
 * - {@link WaveController#getAllNames} - Forwards a request to retrieve all wave names.
 * - {@link WaveController#getWavesMinimum} - Forwards a request to retrieve a minimal projection of all waves.
 * - {@link WaveController#getWavesWithAuth0Id} - Forwards a lookup request for all waves belonging to a given user.
 * - {@link WaveController#getWaves} - Forwards a request to retrieve all wave records.
 * - {@link WaveController#getWaveWithId} - Forwards a lookup request for a single wave by its id.
 * - {@link WaveController#deleteWave} - Forwards a delete request for an existing wave.
 */

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import {
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { ProxyService } from '../../proxy/proxy.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Waves')
@Controller('wave')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WaveController {
  private readonly mailingServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.mailingServiceUrl = this.config.get<string>(
      'MAILING_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  @Get('names')
  @ApiOperation({ summary: 'Retrieve all wave names' })
  getAllNames() {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/wave/names`,
      method: 'GET',
    });
  }

  @Get('minimum')
  @ApiOperation({
    summary:
      'Retrieve projection (excluding recipient information) of all waves',
  })
  getWavesMinimum() {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/wave/minimum`,
      method: 'GET',
    });
  }

  @Get('user/:auth0Id')
  @ApiOperation({ summary: 'Retrieve all waves belonging to a given user' })
  @ApiParam({
    name: 'auth0Id',
    type: 'string',
    example: 'auth0|1',
  })
  getWavesWithAuth0Id(@Param('auth0Id') auth0Id: string) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/wave/user/${auth0Id}`,
      method: 'GET',
    });
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all waves' })
  getWaves() {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/wave`,
      method: 'GET',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific wave by its id' })
  @ApiParam({
    name: 'id',
    type: 'string',
    example: '1234',
  })
  getWaveWithId(@Param('id', ParseUUIDPipe) id: string) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/wave/${id}`,
      method: 'GET',
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an existing wave' })
  @ApiParam({
    name: 'id',
    type: 'string',
    example: '1234',
  })
  deleteWave(@Param('id', ParseUUIDPipe) id: string) {
    return this.proxy.forward({
      url: `${this.mailingServiceUrl}/wave/${id}`,
      method: 'DELETE',
    });
  }
}
