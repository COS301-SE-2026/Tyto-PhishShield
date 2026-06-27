//TODO: Add comments / return dto's / Swagger stuff.

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { XpService } from './xp.service';
import { GiveXpDto } from '../dto/give-xp.dto';

@Controller('xp')
export class XpController {
  constructor(private readonly xpService: XpService) {}

  @Post()
  giveXp(@Body() dto: GiveXpDto) {
    return this.xpService.giveXp(dto);
  }

  @Get()
  getAllXp() {
    return this.xpService.getAllXp();
  }

  @Get('net')
  getNetXpAllUsers() {
    return this.xpService.getNetXpAllUsers();
  }

  @Get(':auth0Id')
  getXpByUser(@Param('auth0Id') auth0Id: string) {
    return this.xpService.getXpByUser(auth0Id);
  }

  @Get(':auth0Id/net')
  getNetXpByUser(@Param('auth0Id') auth0Id: string) {
    return this.xpService.getNetXpByUser(auth0Id);
  }
}
