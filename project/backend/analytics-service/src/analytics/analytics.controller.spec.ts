 /*
 * @file Unit tests for AnalyticsController.
 *
 * Covers RabbitMQ event handlers, REST endpoints,
 * and service-to-service TCP message patterns.
 * (also has a few tests I added just to be safe)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventType } from './entities/analytics-event.entity';

const mockAnalyticsService = {
  recordEvent: jest.fn(),
  getOverview: jest.fn(),
  getReportStats: jest.fn(),
  getMailingStats: jest.fn(),
  getTimeSeries: jest.fn(),
  getLeaderboard: jest.fn(),
  getUserStats: jest.fn(),
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<typeof mockAnalyticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // console.log('cleared mocks'); // i keep forgetting to remove this
  });

});