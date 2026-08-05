import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailStatusEntity } from '../entities/email-status.entity';
import { StatusCreateDto } from '../dto/status-create.dto';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    @InjectRepository(EmailStatusEntity)
    private readonly statusRepository: Repository<EmailStatusEntity>,
  ) {}

  async createStatus(body: StatusCreateDto): Promise<EmailStatusEntity> {
    try {
      const newStatus = this.statusRepository.create({
        ...body,
        createdAt: new Date(),
      });

      const savedStatus = await this.statusRepository.save(newStatus);

      this.logger.log(
        `Status of email: ${body.emailId}, was successfully created`,
      );

      return savedStatus;
    } catch (error) {
      this.logger.error(`Failed to create status`, error);
      throw new InternalServerErrorException('Failed to create status');
    }
  }

  async getStatus(auth0Id: string): Promise<EmailStatusEntity[]> {
    try {
      const entries = await this.statusRepository.find({
        where: { auth0Id },
      });

      this.logger.log(
        `Found ${entries.length}, status entries for auth0Id: ${auth0Id}`,
      );

      return entries;
    } catch (error) {
      this.logger.error(`Failed to fetch status`, error);
      throw new InternalServerErrorException('Failed to fetch status');
    }
  }

  async deleteStatus(emailId: string): Promise<EmailStatusEntity> {
    try {
      const entry = await this.statusRepository.findOne({ where: { emailId } });
      if (entry) {
        try {
          await this.statusRepository.delete({ emailId });

          this.logger.log(`Successfully deleted status: ${emailId}`);

          return entry;
        } catch (error) {
          this.logger.error('Failed to delete status', error);
        }
      } else {
        this.logger.warn(`Status entry not found: ${emailId}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Failed to find / delete status`, error);
      throw new InternalServerErrorException('Failed to find / delete status');
    }
  }
}
