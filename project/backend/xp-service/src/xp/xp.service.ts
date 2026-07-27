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
import { XpEntity } from '../entities/xp.entity';
import { UserEntity } from '../entities/user.entity';
import { GiveXpDto } from '../dto/give-xp.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class XpService {
  private readonly logger = new Logger(XpService.name);

  constructor(
    @InjectRepository(XpEntity)
    private readonly xpRepository: Repository<XpEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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

  async getAllXp(): Promise<XpEntity[]> {
    try {
      return await this.xpRepository.find({ order: { createdAt: 'DESC' } });
    } catch (error) {
      this.logger.error('Failed to fetch all XP records', error);
      throw new InternalServerErrorException('Failed to retrieve XP records');
    }
  }

  async getXpByUser(auth0Id: string): Promise<XpEntity[]> {
    const user = await this.userRepository.findOneBy({ auth0Id });

    if (!user) {
      this.logger.warn(`Get XP failed: user ${auth0Id} not found`);
      throw new NotFoundException(`User ${auth0Id} not found`);
    }

    try {
      return await this.xpRepository.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      });
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

  async getNetXpByUser(
    auth0Id: string,
  ): Promise<{ auth0Id: string; totalXp: number }> {
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
      return { auth0Id, totalXp: Number(result?.totalXp ?? 0) };
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

  async getNetXpAllUsers(): Promise<{ auth0Id: string; totalXp: number }[]> {
    try {
      /*
      Break down of this query:
      - 3 columns are selected: auth0Id, name, totalXp.
      - innerJoin is performed on all users with at least one xp amount.
      - groupBy: id, auth0Id, name (Postgres requires this).
      - orderBy: totalXp decreasing.
      - all rows are returned.
       */
      const rows = await this.xpRepository
        .createQueryBuilder('xp')
        .select('u.auth0Id', 'auth0Id')
        .addSelect('u.name', 'name')
        .addSelect('COALESCE(SUM(xp.amount), 0)', 'totalXp')
        .innerJoin(UserEntity, 'u', 'u.id = xp.userId')
        .groupBy('u.id')
        .addGroupBy('u.auth0Id')
        .addGroupBy('u.name')
        .orderBy('COALESCE(SUM(xp.amount), 0)', 'DESC')
        .getRawMany<{ auth0Id: string; name: string; totalXp: string }>();

      this.logger.log(`Fetched net XP leaderboard for ${rows.length} users`);

      // Replace totalXp with its numerical equivalence
      return rows.map((row) => ({
        auth0Id: row.auth0Id,
        totalXp: Number(row.totalXp),
      }));
    } catch (error) {
      this.logger.error('Failed to fetch net XP for all users', error);
      throw new InternalServerErrorException(
        'Failed to retrieve XP leaderboard',
      );
    }
  }
}
