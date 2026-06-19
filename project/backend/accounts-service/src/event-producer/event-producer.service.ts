/*
 * Services for the different events that is emited to the accounts-event-queue 
 */
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventUser } from './dto/event-user.dto';

@Injectable()
export class EventProducerService {
    constructor(@Inject('RABBITMQ_SERVICE') private rmqClient: ClientProxy) {}

    publishUserCreatedEvent(user: EventUser) {
        this.rmqClient.emit('user.created', user);
    }

    publishUserUpdatedEvent(user: EventUser) {
        this.rmqClient.emit('user.updated', user);
    }

    publishUserDeletedEvent(user: EventUser) {
        this.rmqClient.emit('user.deleted', user);
    }
}
