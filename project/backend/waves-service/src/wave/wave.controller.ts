import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { WaveService } from './wave.service';
import { WaveEntity } from '../entities/wave.entity';
import { WaveDto } from '../dto/wave.dto';
import { WaveMinimumDto } from '../dto/wave-minimum.dto';

@Controller('wave')
export class WaveController {
  constructor(private readonly waveService: WaveService) {}

  @Get('names')
  async getAllNames(): Promise<string[]> {
    return this.waveService.getAllNames();
  }

  @Get('minimum')
  async getWavesMinimum(): Promise<WaveMinimumDto[]> {
    return this.waveService.getWavesMinimum();
  }

  @Get('user/:auth0Id')
  async getWavesWithAuth0Id(
    @Param('auth0Id') auth0Id: string,
  ): Promise<WaveEntity[]> {
    return this.waveService.getWavesWithAuth0Id(auth0Id);
  }

  @Get()
  async getWaves(): Promise<WaveEntity[]> {
    return this.waveService.getWaves();
  }

  @Get(':id')
  async getWaveWithId(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WaveEntity> {
    return this.waveService.getWaveWithId(id);
  }

  @Post()
  async saveWave(@Body() body: WaveDto): Promise<WaveEntity> {
    return this.waveService.saveWave(body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWave(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.waveService.deleteWave(id);
  }
}
