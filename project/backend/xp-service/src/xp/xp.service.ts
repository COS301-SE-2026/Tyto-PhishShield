/**
 * Service: xp-service
 *
 * Contains the business logic for XP (experience point) operations.
 * Manages XP records in the database and aggregates totals per user.
 *
 * Functions:
 * - {@link XpService#giveXp} - Awards XP to a user and persists the entry.
 * - {@link XpService#getAllXp} - Fetches all XP records ordered by creation date.
 * - {@link XpService#getXpByUser} - Returns all XP entries for a specific user.
 * - {@link XpService#getNetXpByUser} - Returns the total (net) XP for a specific user.
 * - {@link XpService#getNetXpAllUsers} - Returns aggregated XP totals for all users, ranked descending.
 */

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XpEntity, XpReason } from '../entities/xp.entity';
import { UserEntity } from '../entities/user.entity';
import { GiveXpDto } from '../dto/give-xp.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { XpResponseDto } from '../dto/xp-response.dto';
import { NetXpResponseDto } from '../dto/net-xp-response.dto';
import { EmailDetailsEntity } from '../entities/email-details.entity';
import { MailingBatchEventDto } from '../dto/mailing-batch-event.dto';

@Injectable()
export class XpService {
  private readonly logger = new Logger(XpService.name);

  constructor(
    @InjectRepository(XpEntity)
    private readonly xpRepository: Repository<XpEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EmailDetailsEntity)
    private readonly emailDetailsRepository: Repository<EmailDetailsEntity>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async giveXp(dto: GiveXpDto): Promise<XpEntity> {
    const user = await this.userRepository.findOneBy({ auth0Id: dto.auth0Id });

    if (!user) {
      this.logger.warn(`Give XP failed: user ${dto.auth0Id} not found`);
      throw new NotFoundException(`User ${dto.auth0Id} not found`);
    }

    try {
      const entry = this.xpRepository.create({
        userId: user.id,
        amount: dto.amount,
        reason: dto.reason,
      });

      const saved = await this.xpRepository.save(entry);
      this.logger.log(
        `Awarded ${dto.amount} XP to user ${dto.auth0Id}, reason: ${dto.reason}`,
      );

      try {
        await this.amqpConnection.publish('xp-event-exchange', 'xp.given', {
          auth0Id: user.auth0Id,
          amount: dto.amount,
          reason: dto.reason,
        });
      } catch (publishError) {
        this.logger.error(
          `Failed to publish xp.given event for user ${dto.auth0Id}`,
          publishError,
        );
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to award XP to user ${dto.auth0Id}`, error);
      throw new InternalServerErrorException('Failed to award XP');
    }
  }

  async createEmailDetails(event: MailingBatchEventDto): Promise<void> {
    if (!event?.entries?.length) {
      return;
    }

    for (const entry of event.entries) {
      try {
        const existingEntry = await this.emailDetailsRepository.findOneBy({
          token: entry.token,
        });

        if (existingEntry) {
          this.logger.warn(
            `Mailing Event already exists: ${entry.token}, entry will be skipped`,
          );
          continue;
        }

        const user = await this.userRepository.findOneBy({
          auth0Id: entry.auth0Id,
        });

        if (!user) {
          this.logger.warn(
            `User with auth0Id: ${entry.auth0Id} is not in users table, entry will be skipped`,
          );
          continue;
        }

        const createdEntry = this.emailDetailsRepository.create({
          token: entry.token,
          auth0Id: entry.auth0Id,
          referenceNumber: entry.referenceNumber,
          emailId: entry.emailId,
          scheduledAt: new Date(entry.scheduledAt),
          waveId: entry.waveId ?? null,
        });

        await this.emailDetailsRepository.save(createdEntry);
      } catch (error) {
        this.logger.error(
          `Failed to save event entry from mailing batch service to the xp email_details table: ${entry.token}`,
          error,
        );
      }
    }
    this.logger.log(
      `Successfully saved event from mailing batch service to the xp email_details table`,
    );
  }

  async linkClicked(token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const details_entry = await this.emailDetailsRepository.findOneBy({
      token,
    });

    if (!details_entry) {
      this.logger.warn(`Token from link clicked not found: ${token}`);
      throw new NotFoundException('Token not found');
    }

    if (details_entry.clicked) {
      return {
        success: true,
        message: `Link with token: ${token}, was already clicked`,
      };
    }

    const user = await this.userRepository.findOneBy({
      auth0Id: details_entry.auth0Id,
    });

    if (!user) {
      this.logger.warn(`User not found for auth0Id: ${details_entry.auth0Id}`);
      throw new NotFoundException('User not found');
    }

    try {
      const xp_entry = this.xpRepository.create({
        userId: user.id,
        amount: -40,
        reason: XpReason.COMPROMISED,
      });

      const saved = await this.xpRepository.save(xp_entry);

      details_entry.clicked = true;
      await this.emailDetailsRepository.save(details_entry);

      this.logger.log(
        `Reduced XP of user ${user.auth0Id} by ${saved.amount} for compromised link: ${token}`,
      );

      try {
        await this.amqpConnection.publish('xp-event-exchange', 'xp.given', {
          auth0Id: user.auth0Id,
          amount: saved.amount,
          reason: XpReason.COMPROMISED,
        });
      } catch (publishError) {
        this.logger.error(
          `Failed to publish xp.given event for user ${user.auth0Id}`,
          publishError,
        );
      }

      return {
        success: true,
        message: `Link with token: ${token} was successfully marked as clicked and XP was deducted`,
      };
    } catch (error) {
      this.logger.error(`Failed to reduce XP for user ${user.auth0Id}`, error);
      throw new InternalServerErrorException('Failed to reduce XP');
    }
  }

  async getAllXp(): Promise<XpResponseDto[]> {
    try {
      const entries = await this.xpRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });

      return entries.map((entry) => ({
        id: entry.id,
        amount: entry.amount,
        reason: entry.reason,
        createdAt: entry.createdAt,
        user: {
          auth0Id: entry.user.auth0Id,
          name: entry.user.name,
          email: entry.user.email,
          department: entry.user.department,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to fetch all XP records', error);
      throw new InternalServerErrorException('Failed to retrieve XP records');
    }
  }

  async getXpByUser(auth0Id: string): Promise<XpResponseDto[]> {
    const user = await this.userRepository.findOneBy({ auth0Id });

    if (!user) {
      this.logger.warn(`Get XP failed: user ${auth0Id} not found`);
      throw new NotFoundException(`User ${auth0Id} not found`);
    }

    try {
      const entries = await this.xpRepository.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      });

      return entries.map((entry) => ({
        id: entry.id,
        amount: entry.amount,
        reason: entry.reason,
        createdAt: entry.createdAt,
        user: {
          auth0Id: user.auth0Id,
          name: user.name,
          email: user.email,
          department: user.department,
        },
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch XP records for user ${auth0Id}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to retrieve XP records for user ${auth0Id}`,
      );
    }
  }

  async getNetXpByUser(auth0Id: string): Promise<NetXpResponseDto> {
    const user = await this.userRepository.findOneBy({ auth0Id });

    if (!user) {
      this.logger.warn(`Get net XP failed: user ${auth0Id} not found`);
      throw new NotFoundException(`User ${auth0Id} not found`);
    }

    try {
      // Creates a column: totalXp
      const result = await this.xpRepository
        .createQueryBuilder('xp')
        .select('COALESCE(SUM(xp.amount), 0)', 'totalXp')
        .where('xp.userId = :userId', { userId: user.id })
        .getRawOne<{ totalXp: string }>();

      this.logger.log(`Fetched net XP for user ${auth0Id}`);

      return {
        totalXp: Number(result?.totalXp ?? 0),
        user: {
          auth0Id: user.auth0Id,
          name: user.name,
          email: user.email,
          department: user.department,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate net XP for user ${auth0Id}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to calculate net XP for user ${auth0Id}`,
      );
    }
  }

  async getNetXpAllUsers(): Promise<NetXpResponseDto[]> {
    try {
      /*
      Break down of this query:
      - 5 columns are selected: auth0Id, name, email, department, totalXp.
      - innerJoin is performed on all users with at least one xp amount.
      - groupBy: id, auth0Id, name, email, department (Postgres requires this).
      - orderBy: totalXp decreasing.
      - all rows are returned.
       */
      const rows = await this.xpRepository
        .createQueryBuilder('xp')
        .select('u.auth0Id', 'auth0Id')
        .addSelect('u.name', 'name')
        .addSelect('u.email', 'email')
        .addSelect('u.department', 'department')
        .addSelect('COALESCE(SUM(xp.amount), 0)', 'totalXp')
        .innerJoin(UserEntity, 'u', 'u.id = xp.userId')
        .groupBy('u.id')
        .addGroupBy('u.auth0Id')
        .addGroupBy('u.name')
        .addGroupBy('u.email')
        .addGroupBy('u.department')
        .orderBy('COALESCE(SUM(xp.amount), 0)', 'DESC')
        .getRawMany<{
          auth0Id: string;
          name: string;
          email: string;
          department: string;
          totalXp: string;
        }>();

      this.logger.log(`Fetched net XP leaderboard for ${rows.length} users`);

      // Replace totalXp with its numerical equivalence
      return rows.map((row) => ({
        totalXp: Number(row.totalXp),
        user: {
          auth0Id: row.auth0Id,
          name: row.name,
          email: row.email,
          department: row.department,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to fetch net XP for all users', error);
      throw new InternalServerErrorException(
        'Failed to retrieve XP leaderboard',
      );
    }
  }
}
