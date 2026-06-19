import { Test, TestingModule } from '@nestjs/testing';
import { EventProducerService } from './event-producer.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

describe('EventProducerService', () => {
  let service: EventProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventProducerService, {
          provide: AmqpConnection,
          useValue: {
            publish: jest.fn(),
          },
        },],
    }).compile();

    service = module.get<EventProducerService>(EventProducerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
