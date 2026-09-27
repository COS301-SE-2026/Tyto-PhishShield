import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Logger,
} from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ConnectionService } from './connection.service';
import {
  CreateConnectionDto,
  UpdateConnectionDto,
  COMMS_EVENT_EXCHANGE,
  CommunicationRecordedEvent,
  StrongConnectionEvent,
} from '../dto/connection.dto';

@Controller('connections')
export class ConnectionController {
  private readonly logger = new Logger(ConnectionController.name);

  constructor(private readonly connectionsService: ConnectionService) {}

  @Post()
  create(@Body() dto: CreateConnectionDto) {
    return this.connectionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConnectionDto) {
    return this.connectionsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.connectionsService.delete(id);
  }

  @Get(':auth0Id')
  findByAuth0Id(@Param('auth0Id') auth0Id: string) {
    return this.connectionsService.findByAuth0Id(auth0Id);
  }

  @RabbitSubscribe({
    exchange: COMMS_EVENT_EXCHANGE,
    routingKey: 'comms.message.recorded',
    queue: 'connection.comms.recorded',
  })
  async handleCommunicationRecorded(
    payload: CommunicationRecordedEvent,
  ): Promise<void> {
    try {
      for (const receiverAuth0Id of payload.receiverAuth0Ids) {
        await this.connectionsService.recordCommunication(
          payload.senderAuth0Id,
          receiverAuth0Id,
          payload.source,
          payload.occurredAt,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process comms.message.recorded from ${payload.senderAuth0Id}`,
        error,
      );
      throw error;
    }
  }

  @RabbitSubscribe({
    exchange: COMMS_EVENT_EXCHANGE,
    routingKey: 'comms.connection.strong',
    queue: 'connection.comms.strong',
  })
  async handleStrongConnection(payload: StrongConnectionEvent): Promise<void> {
    try {
      await this.connectionsService.markStrongConnection(payload);
    } catch (error) {
      this.logger.error(
        `Failed to process comms.connection.strong between ${payload.senderAuth0Id} and ${payload.receiverAuth0Id}`,
        error,
      );
      throw error;
    }
  }
}
