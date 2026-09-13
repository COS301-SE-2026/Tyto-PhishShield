import { Injectable, NotFoundException } from '@nestjs/common';
import { Department, UserEntity } from '../entities/user.entity';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import * as crypto from 'crypto';

@Injectable()
export class SenderResolverService {
  private extractLocalPart(email: string): string {
    const [localPart] = email.split('@');
    return localPart;
  }

  private pickRandomSenderLocalPart(
    recipientAuth0Id: string,
    senderPool: UserEntity[],
    department?: Department,
  ): string {
    const eligible = senderPool.filter(
      (user) =>
        user.auth0Id !== recipientAuth0Id &&
        (!department || user.department === department),
    );

    if (eligible.length === 0) {
      throw new NotFoundException(
        department
          ? `No eligible sender found in department: ${department}`
          : 'No eligible sender found to pick at random',
      );
    }

    const chosen = eligible[crypto.randomInt(eligible.length)];
    return this.extractLocalPart(chosen.email);
  }

  resolveFromAddress(
    email: EmailTemplateEntity,
    recipientAuth0Id: string,
    senderPool: UserEntity[],
    senderName?: string,
    alias?: string,
  ): string {
    const localPart =
      senderName ??
      this.pickRandomSenderLocalPart(
        recipientAuth0Id,
        senderPool,
        email.senderDepartment,
      );

    const address = `${localPart}@${email.sender}`;
    return alias ? `${alias} <${address}>` : address;
  }
}
