import { Injectable, NotFoundException } from '@nestjs/common';
import { Department, UserEntity } from '../entities/user.entity';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

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
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.auth0Id != :recipientAuth0Id', { recipientAuth0Id })
      .orderBy('RANDOM()')
      .limit(1);

    if (department) {
      query.andWhere('user.department = :department', { department });
    }

    const chosen = await query.getOne();

    if (!chosen) {
      throw new NotFoundException(
        department
          ? `No eligible sender found in department: ${department}`
          : 'No eligible sender found to pick at random',
      );
    }

    return this.extractLocalPart(chosen.email);
  }

  async resolveFromAddress(
    email: EmailTemplateEntity,
    recipientAuth0Id: string,
    senderName?: string,
    alias?: string,
  ): Promise<string> {
    const localPart =
      senderName ??
      (await this.pickRandomSenderLocalPart(
        recipientAuth0Id,
        email.senderDepartment,
      ));

    const address = `${localPart}@${email.sender}`;
    return alias ? `${alias} <${address}>` : address;
  }
}
