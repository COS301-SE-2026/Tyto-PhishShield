import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionEntity } from '../entities/connection.entity';
import {
  CreateConnectionDto,
  UpdateConnectionDto,
  StrongConnectionEvent,
} from '../dto/connection.dto';

@Injectable()
export class ConnectionService {
  constructor(
    @InjectRepository(ConnectionEntity)
    private readonly connectionRepository: Repository<ConnectionEntity>,
  ) {}

  async create(dto: CreateConnectionDto): Promise<ConnectionEntity> {
    const connection = this.connectionRepository.create({
      ...dto,
      lastInteractionAt: dto.lastInteractionAt
        ? new Date(dto.lastInteractionAt)
        : new Date(),
    });
    return this.connectionRepository.save(connection);
  }

  async update(
    id: string,
    dto: UpdateConnectionDto,
  ): Promise<ConnectionEntity> {
    const connection = await this.findOneConnection(id);
    Object.assign(connection, {
      ...dto,
      lastInteractionAt: dto.lastInteractionAt
        ? new Date(dto.lastInteractionAt)
        : connection.lastInteractionAt,
    });
    return this.connectionRepository.save(connection);
  }

  async delete(id: string): Promise<void> {
    const result = await this.connectionRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(`Connection ${id} not found`);
    }
  }

  async findByAuth0Id(auth0Id: string): Promise<ConnectionEntity[]> {
    return this.connectionRepository.find({
      where: [{ senderAuth0Id: auth0Id }, { receiverAuth0Id: auth0Id }],
      order: { lastInteractionAt: 'DESC' },
    });
  }

  async findOneConnection(id: string): Promise<ConnectionEntity> {
    const connection = await this.connectionRepository.findOne({
      where: { id },
    });
    if (!connection) {
      throw new NotFoundException(`Connection ${id} not found`);
    }
    return connection;
  }

  async recordCommunication(
    senderAuth0Id: string,
    receiverAuth0Id: string,
    source: string,
    occurredAt: string,
  ): Promise<void> {
    let connection = await this.connectionRepository.findOne({
      where: { senderAuth0Id, receiverAuth0Id },
    });

    if (!connection) {
      connection = this.connectionRepository.create({
        senderAuth0Id,
        receiverAuth0Id,
        messageCount: 0,
      });
    }

    connection.messageCount += 1;
    connection.source = source;
    connection.lastInteractionAt = new Date(occurredAt);

    await this.connectionRepository.save(connection);
  }

  async markStrongConnection(payload: StrongConnectionEvent): Promise<void> {
    let connection = await this.connectionRepository.findOne({
      where: {
        senderAuth0Id: payload.senderAuth0Id,
        receiverAuth0Id: payload.receiverAuth0Id,
      },
    });

    if (!connection) {
      connection = this.connectionRepository.create({
        senderAuth0Id: payload.senderAuth0Id,
        receiverAuth0Id: payload.receiverAuth0Id,
      });
    }

    connection.senderName = payload.senderName;
    connection.senderEmail = payload.senderEmail;
    connection.receiverName = payload.receiverName;
    connection.receiverEmail = payload.receiverEmail;
    connection.messageCount = payload.messageCount;
    connection.threshold = payload.threshold;
    connection.lastInteractionAt = new Date(payload.lastInteractionAt);
    connection.isStrong = true;

    await this.connectionRepository.save(connection);
  }
}
