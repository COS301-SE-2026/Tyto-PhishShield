/**
 * Service: xp-service
 *
 * Handles incoming HTTP requests for XP (experience point) operations.
 * Exposes REST endpoints for awarding XP and querying XP records or totals.
 *
 * Functions:
 * - {@link XpController#eventGiveXp} - Awards XP to a user from the event exchange
 * - {@link XpController#giveXp} - Awards XP to a user.
 * - {@link XpController#getAllXp} - Returns all XP records from the database.
 * - {@link XpController#getNetXpAllUsers} - Returns aggregated XP totals for all users.
 * - {@link XpController#getXpByUser} - Returns all XP entries for a specific user.
 * - {@link XpController#getNetXpByUser} - Returns the total (net) XP for a specific user.
 */

import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { XpService } from './xp.service';
import { GiveXpDto } from '../dto/give-xp.dto';
import { XpEntity } from '../entities/xp.entity';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { XpResponseDto } from '../dto/xp-response.dto';
import { NetXpResponseDto } from '../dto/net-xp-response.dto';
import { MailingBatchEventDto } from '../dto/mailing-batch-event.dto';
import { TokenDto } from '../dto/token.dto';

@Controller('xp')
export class XpController {
  private readonly logger = new Logger(XpController.name);

  constructor(private readonly xpService: XpService) {}

  @RabbitSubscribe({
    exchange: 'xp-event-exchange',
    routingKey: 'xp.give',
    queue: 'xp-queue',
  })
  async eventGiveXp(xpObject: GiveXpDto): Promise<void> {
    try {
      await this.xpService.giveXp(xpObject);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Dropping xp.give event: ${error.message}`);
        return;
      }
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: 'mailing-event-exchange',
    routingKey: ['mailing.batch_send', 'mailing.batch_schedule'],
    queue: 'xp-email-details-queue',
  })
  async eventCreateEmailDetails(event: MailingBatchEventDto): Promise<void> {
    await this.xpService.createEmailDetails(event);
  }

  @Post()
  async giveXp(@Body() dto: GiveXpDto): Promise<XpEntity> {
    return this.xpService.giveXp(dto);
  }

  @Post('link-clicked')
  async linkClicked(
    @Body() tokenDto: TokenDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.xpService.linkClicked(tokenDto.token);
  }

  @Get()
  async getAllXp(): Promise<XpResponseDto[]> {
    return this.xpService.getAllXp();
  }

  @Get('net')
  async getNetXpAllUsers(): Promise<NetXpResponseDto[]> {
    return this.xpService.getNetXpAllUsers();
  }

  @Get(':auth0Id')
  async getXpByUser(
    @Param('auth0Id') auth0Id: string,
  ): Promise<XpResponseDto[]> {
    return this.xpService.getXpByUser(auth0Id);
  }

  @Get(':auth0Id/net')
  async getNetXpByUser(
    @Param('auth0Id') auth0Id: string,
  ): Promise<NetXpResponseDto> {
    return this.xpService.getNetXpByUser(auth0Id);
  }
}
