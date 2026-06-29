/**
 * Service: xp-service
 *
 * Handles incoming HTTP requests for XP (experience point) operations.
 * Exposes REST endpoints for awarding XP and querying XP records or totals.
 *
 * Functions:
 * - {@link XpController#giveXp} - Awards XP to a user.
 * - {@link XpController#getAllXp} - Returns all XP records from the database.
 * - {@link XpController#getNetXpAllUsers} - Returns aggregated XP totals for all users.
 * - {@link XpController#getXpByUser} - Returns all XP entries for a specific user.
 * - {@link XpController#getNetXpByUser} - Returns the total (net) XP for a specific user.
 */

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { XpService } from './xp.service';
import { GiveXpDto } from '../dto/give-xp.dto';
import { XpEntity } from '../entities/xp.entity';

@Controller('xp')
export class XpController {
  constructor(private readonly xpService: XpService) {}

  @Post()
  async giveXp(@Body() dto: GiveXpDto): Promise<XpEntity> {
    return this.xpService.giveXp(dto);
  }

  @Get()
  async getAllXp(): Promise<XpEntity[]> {
    return this.xpService.getAllXp();
  }

  @Get('net')
  async getNetXpAllUsers(): Promise<{ auth0Id: string; totalXp: number }[]> {
    return this.xpService.getNetXpAllUsers();
  }

  @Get(':auth0Id')
  async getXpByUser(@Param('auth0Id') auth0Id: string): Promise<XpEntity[]> {
    return this.xpService.getXpByUser(auth0Id);
  }

  @Get(':auth0Id/net')
  async getNetXpByUser(
    @Param('auth0Id') auth0Id: string,
  ): Promise<{ auth0Id: string; totalXp: number }> {
    return this.xpService.getNetXpByUser(auth0Id);
  }
}
