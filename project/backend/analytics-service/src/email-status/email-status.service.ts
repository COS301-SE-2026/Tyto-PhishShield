import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailStatusEntity } from './entities/email-status.entity';
import { StatusCreateDto } from '../dto/status-create.dto';

@Injectable()
export class EmailStatusService {
  private readonly logger = new Logger(EmailStatusService.name);

  constructor(
    @InjectRepository(EmailStatusEntity)
    private readonly statusRepository: Repository<EmailStatusEntity>,
  ) {}

  async createStatus(body: StatusCreateDto): Promise<EmailStatusEntity> {
    try {
      const entity = await this.statusRepository.findOne({
        where: { webhookEventId: body.webhookEventId },
      });
      if (entity) {
        this.logger.warn(
          `Entity with webhookEventId: ${body.webhookEventId} already exists`,
        );
        return entity;
      }
      const newStatus = this.statusRepository.create(body);

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

  async getStatus(emailId: string): Promise<EmailStatusEntity[]> {
    try {
      const entries = await this.statusRepository.find({
        where: { emailId },
      });

      this.logger.log(
        `Found ${entries.length}, status entries for emailId: ${emailId}`,
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
      if (!entry) {
        this.logger.warn(`Status entry not found: ${emailId}`);
        throw new NotFoundException(`Status entry not found: ${emailId}`);
      }

      await this.statusRepository.delete({ emailId });
      this.logger.log(`Successfully deleted status: ${emailId}`);

      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find / delete status`, error);
      throw new InternalServerErrorException('Failed to find / delete status');
    }
  }
}
