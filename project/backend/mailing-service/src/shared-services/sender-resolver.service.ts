import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department, UserEntity } from '../entities/user.entity';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SenderResolverService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private extractLocalPart(email: string): string {
    const [localPart] = email.split('@');
    return localPart;
  }

  private async pickRandomSenderLocalPart(
    recipientAuth0Id: string,
    department?: Department,
  ): Promise<string> {
    const pool = await this.userRepository.find(
      department ? { where: { department } } : {},
    );
    const eligible = pool.filter((user) => user.auth0Id !== recipientAuth0Id);

    if (eligible.length === 0) {
      throw new NotFoundException(
        department
          ? `No eligible sender found in department ${department}`
          : `No eligible sender found to pick at random`,
      );
    }

    const chosen = eligible[crypto.randomInt(eligible.length)];
    return this.extractLocalPart(chosen.email);
  }

  async resolveFromAddress(
    email: EmailTemplateEntity,
    recipientAuth0Id: string,
    senderCustomName?: string,
    senderAuth0Id?: string,
    alias?: string,
  ): Promise<string> {
    if (senderCustomName && senderAuth0Id) {
      throw new BadRequestException(
        'Cannot have both custom sender name and sender Auth0 ID',
      );
    }

    if (senderCustomName) {
      return this.formatAddress(senderCustomName, email.sender, alias);
    }

    if (senderAuth0Id) {
      const sender = await this.userRepository.findOne({
        where: { auth0Id: senderAuth0Id },
      });
      if (!sender) {
        throw new NotFoundException(
          `Could not find user with id: ${senderAuth0Id}`,
        );
      }
      return this.formatAddress(
        this.extractLocalPart(sender.email),
        email.sender,
        alias,
      );
    }
    const randomSender = await this.pickRandomSenderLocalPart(
      recipientAuth0Id,
      email.senderDepartment,
    );
    return this.formatAddress(randomSender, email.sender, alias);
  }

  formatAddress(sender: string, domain: string, alias?: string): string {
    return alias ? `${alias} <${sender}@${domain}>` : `${sender}@${domain}`;
  }
}
