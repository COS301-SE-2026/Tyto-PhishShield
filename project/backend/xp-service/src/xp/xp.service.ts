// TODO: Add comments, logs and returning dto's

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XpEntity } from '../entities/xp.entity';
import { UserEntity } from '../entities/user.entity';
import { GiveXpDto } from '../dto/give-xp.dto';

@Injectable()
export class XpService {
  constructor(
    @InjectRepository(XpEntity)
    private readonly xpRepository: Repository<XpEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async giveXp(dto: GiveXpDto): Promise<XpEntity> {
    const user = await this.userRepository.findOneBy({ auth0Id: dto.auth0Id });

    if (!user) {
      throw new NotFoundException(`User ${dto.auth0Id} not found`);
    }

    const entry = this.xpRepository.create({
      userId: user.id,
      amount: dto.amount,
      reason: dto.reason,
    });

    return this.xpRepository.save(entry);
  }

  getAllXp(): Promise<XpEntity[]> {
    return this.xpRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getXpByUser(auth0Id: string): Promise<XpEntity[]> {
    const user = await this.userRepository.findOneBy({ auth0Id });

    if (!user) {
      throw new NotFoundException(`User ${auth0Id} not found`);
    }

    return this.xpRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getNetXpByUser(
    auth0Id: string,
  ): Promise<{ auth0Id: string; totalXp: number }> {
    const user = await this.userRepository.findOneBy({ auth0Id });

    if (!user) {
      throw new NotFoundException(`User ${auth0Id} not found`);
    }

    // Creates a column: totalXp
    const result = await this.xpRepository
      .createQueryBuilder('xp')
      .select('COALESCE(SUM(xp.amount), 0)', 'totalXp')
      .where('xp.userId = :userId', { userId: user.id })
      .getRawOne<{ totalXp: string }>();

    return { auth0Id, totalXp: Number(result?.totalXp ?? 0) };
  }

  async getNetXpAllUsers(): Promise<
    { auth0Id: string; name: string; totalXp: number }[]
  > {
    /*
    Bread down of this query:
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
      .orderBy('totalXp', 'DESC')
      .getRawMany<{ auth0Id: string; name: string; totalXp: string }>();

    // Replace totalXp with its numerical equivalence
    return rows.map((r) => ({ ...r, totalXp: Number(r.totalXp) }));
  }
}
