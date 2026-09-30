import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department, UserEntity } from '../entities/user.entity';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionEntity } from '../entities/connection.entity';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';
import { RecommendationLevel, SenderRecommendation } from '@phishshield/dto';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';

interface ConnectionSummary {
  messageCount: number;
  isStrong: boolean;
  lastInteractionAt: Date;
}

interface ScoredCandidate {
  user: UserEntity;
  score: number;
  reasons: string[];
  isManager: boolean;
}

export type AvailableVariableKey = 'name' | 'surname' | 'job_title' | 'title';

export interface AvailableVariables {
  sender: AvailableVariableKey[];
  recipient: AvailableVariableKey[];
}

@Injectable()
export class SenderResolverService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ConnectionEntity)
    private readonly connectionRepository: Repository<ConnectionEntity>,
    @InjectRepository(EmployeeInfoEntity)
    private readonly employeeInfoRepository: Repository<EmployeeInfoEntity>,
    private readonly config: ConfigService,
  ) {}

  async resolveSpoofedAddress(
    auth0Id: string,
    alias?: string,
  ): Promise<string> {
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    if (!user) {
      throw new NotFoundException(`Could not find user with id: ${auth0Id}`);
    }
    const businessDomain = this.config.getOrThrow<string>(
      'BUSINESS_SENDING_DOMAIN',
    );
    return this.formatAddress(
      this.extractLocalPart(user.email),
      businessDomain,
      alias,
    );
  }

  private extractLocalPart(email: string): string {
    const [localPart] = email.split('@');
    return localPart;
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
    const bestFitSender = await this.pickBestFitSenderLocalPart(
      recipientAuth0Id,
      email.senderDepartment,
    );
    return this.formatAddress(bestFitSender, email.sender, alias);
  }

  formatAddress(sender: string, domain: string, alias?: string): string {
    return alias ? `${alias} <${sender}@${domain}>` : `${sender}@${domain}`;
  }

  // Roulette-Wheel algorithm
  private weightedRandomPick(
    users: UserEntity[],
    weights: number[],
  ): UserEntity {
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
      total = total + weights[i];
    }

    const RANDOM_PRECISION = 1_000_000;
    // choose a random number between 0 and total.
    const chosenNumber =
      (randomInt(RANDOM_PRECISION) / RANDOM_PRECISION) * total;

    let runningTotal = 0;
    for (let i = 0; i < users.length; i++) {
      runningTotal = runningTotal + weights[i];
      if (runningTotal >= chosenNumber) {
        return users[i];
      }
    }
    return users[users.length - 1];
  }

  private async scoreCandidates(
    recipientAuth0Id: string,
    department?: Department,
  ): Promise<ScoredCandidate[]> {
    const pool = await this.userRepository.find(
      department ? { where: { department } } : {},
    );
    const eligible = pool.filter((user) => user.auth0Id !== recipientAuth0Id);
    if (eligible.length === 0) {
      throw new NotFoundException(
        department
          ? `No eligible sender found in department ${department}`
          : 'No eligible sender found',
      );
    }

    const [connections, recipientInfo] = await Promise.all([
      this.connectionRepository.find({
        where: [
          { senderAuth0Id: recipientAuth0Id },
          { receiverAuth0Id: recipientAuth0Id },
        ],
      }),
      this.employeeInfoRepository.findOne({
        where: { auth0Id: recipientAuth0Id },
      }),
    ]);

    const summaries = this.mergeConnections(recipientAuth0Id, connections);

    const scored: ScoredCandidate[] = [];
    for (const user of eligible) {
      const isManager = recipientInfo?.managerId === user.auth0Id;
      const { score, reasons } = this.computeScore(
        summaries.get(user.auth0Id) ?? null,
        isManager,
      );
      scored.push({ user, score, reasons, isManager });
    }
    return scored;
  }

  private mergeConnections(
    recipientAuth0Id: string,
    connections: ConnectionEntity[],
  ): Map<string, ConnectionSummary> {
    const summaryByPerson = new Map<string, ConnectionSummary>();

    for (const connection of connections) {
      let otherPersonId: string;
      if (connection.senderAuth0Id === recipientAuth0Id) {
        otherPersonId = connection.receiverAuth0Id;
      } else {
        otherPersonId = connection.senderAuth0Id;
      }

      const alreadySeen = summaryByPerson.get(otherPersonId);

      if (alreadySeen === undefined) {
        summaryByPerson.set(otherPersonId, {
          messageCount: connection.messageCount,
          isStrong: connection.isStrong,
          lastInteractionAt: connection.lastInteractionAt,
        });
      } else {
        alreadySeen.messageCount =
          alreadySeen.messageCount + connection.messageCount;

        if (connection.isStrong) {
          alreadySeen.isStrong = true;
        }

        if (connection.lastInteractionAt > alreadySeen.lastInteractionAt) {
          alreadySeen.lastInteractionAt = connection.lastInteractionAt;
        }
      }
    }

    return summaryByPerson;
  }

  private computeScore(
    connection: ConnectionSummary | null,
    isManager: boolean,
  ): { score: number; reasons: string[] } {
    let score = 1;
    const reasons: string[] = [];

    if (connection) {
      score += Math.log1p(connection.messageCount) * 3;
      reasons.push(`${connection.messageCount} messages exchanged`);

      if (connection.isStrong) {
        score += 5;
        reasons.push('Flagged as a strong connection');
      }

      const daysSinceContact =
        (Date.now() - connection.lastInteractionAt.getTime()) / 86_400_000;
      const recencyBonus = Math.max(0, 10 - daysSinceContact / 7);
      score += recencyBonus;
      if (recencyBonus > 0) {
        reasons.push(`Last contact ${Math.round(daysSinceContact)} days ago`);
      }
    }

    if (isManager) {
      score += 8;
      reasons.push("Recipient's manager");
    }

    if (reasons.length === 0) {
      reasons.push('No prior interaction on record');
    }

    return { score, reasons };
  }

  private async pickBestFitSenderLocalPart(
    recipientAuth0Id: string,
    department?: Department,
  ): Promise<string> {
    const scored = await this.scoreCandidates(recipientAuth0Id, department);

    const users = scored.map((s) => s.user);
    const weights = scored.map((s) => s.score);

    const chosen = this.weightedRandomPick(users, weights);
    return this.extractLocalPart(chosen.email);
  }

  async getRecommendedSenders(
    recipientAuth0Id: string,
    department?: Department,
  ): Promise<SenderRecommendation[]> {
    const scored = await this.scoreCandidates(recipientAuth0Id, department);

    let highestScore = 0;

    for (const s of scored) {
      if (s.score > highestScore) {
        highestScore = s.score;
      }
    }

    const recommendations: SenderRecommendation[] = scored.map((s) => ({
      auth0Id: s.user.auth0Id,
      email: s.user.email,
      department: s.user.department,
      score: Math.round(s.score * 10) / 10,
      recommendation: this.toLevel(s.score, highestScore),
      reasons: s.reasons,
      isManager: s.isManager,
    }));

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private toLevel(score: number, highestScore: number): RecommendationLevel {
    const ratio = score / highestScore;
    if (ratio > 0.66) return 'high';
    if (ratio > 0.33) return 'medium';
    return 'low';
  }

  async getAvailableVariables(
    senderAuth0Id: string,
    recipientAuth0Id: string,
  ): Promise<AvailableVariables> {
    const [sender, recipient] = await Promise.all([
      this.loadUserAndEmployeeInfo(senderAuth0Id),
      this.loadUserAndEmployeeInfo(recipientAuth0Id),
    ]);

    return {
      sender: this.presentVariables(sender.user, sender.employeeInfo),
      recipient: this.presentVariables(recipient.user, recipient.employeeInfo),
    };
  }

  private async loadUserAndEmployeeInfo(
    auth0Id: string,
  ): Promise<{ user: UserEntity; employeeInfo?: EmployeeInfoEntity }> {
    const user = await this.userRepository.findOne({ where: { auth0Id } });
    if (!user) {
      throw new NotFoundException(`Could not find user with id: ${auth0Id}`);
    }
    const employeeInfo = await this.employeeInfoRepository.findOne({
      where: { auth0Id },
    });
    return { user, employeeInfo: employeeInfo ?? undefined };
  }

  private presentVariables(
    user: UserEntity,
    employeeInfo?: EmployeeInfoEntity,
  ): AvailableVariableKey[] {
    const available: AvailableVariableKey[] = [];
    if (user.firstName) available.push('name');
    if (user.lastName) available.push('surname');
    if (employeeInfo && employeeInfo.jobTitle) available.push('job_title');
    if (employeeInfo && employeeInfo.title) available.push('title');

    return available;
  }
}
