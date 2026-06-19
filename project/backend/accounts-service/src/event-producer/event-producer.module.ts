/*
 * This module handles publishing event to the accounts-event-queue
*/

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventProducerService } from './event-producer.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'RABBITMQ_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: [],
                    queue: 'accounts-event-queue',
                    queueOptions:{
                        durable: true,
                    }
                }
            }
        ])
    ],
    providers: [EventProducerService],
    exports: [EventProducerService]
})
export class EventProducerModule {}
