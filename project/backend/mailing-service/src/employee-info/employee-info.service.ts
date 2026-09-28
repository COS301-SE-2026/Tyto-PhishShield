/**
 * @Class EmployeeInfoService
 *
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { EventEmployee } from '@phishshield/dto';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';

export class InvalidEmployeeEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmployeeEventError';
  }
}

@Injectable()
export class EmployeeInfoService {
  private readonly logger = new Logger(EmployeeInfoService.name);

  constructor(
    @InjectRepository(EmployeeInfoEntity)
    private readonly db: Repository<EmployeeInfoEntity>,
  ) {}

  private validateEvent(event: EventEmployee): void {
    if (!event || typeof event !== 'object') {
      throw new InvalidEmployeeEventError(
        'employeeInfo event payload is missing or not an object',
      );
    }
    if (!event.auth0Id) {
      throw new InvalidEmployeeEventError(
        'employeeInfo event missing required field: auth0Id',
      );
    }
  }

  async upsert(event: EventEmployee) {
    this.validateEvent(event);

    try {
      const existing = await this.db.findOne({
        where: { auth0Id: event.auth0Id },
      });

      if (existing) {
        Object.assign(existing, {
          managerId: event.managerId || undefined,
          jobTitle: event.jobTitle,
          title: event.title,
        });
        return await this.db.save(existing);
      }

      const newEntry = this.db.create({
        auth0Id: event.auth0Id,
        managerId: event.managerId || undefined,
        jobTitle: event.jobTitle,
        title: event.title,
      });
      return await this.db.save(newEntry);
    } catch (err: unknown) {
      if (err instanceof QueryFailedError) {
        this.logger.error(
          `Failed to save employee info for ${event.auth0Id}`,
          err,
        );
        return;
      }
      throw err;
    }
  }

  async findByAuth0Id(auth0Id: string) {
    return await this.db.findOne({ where: { auth0Id } });
  }
}
