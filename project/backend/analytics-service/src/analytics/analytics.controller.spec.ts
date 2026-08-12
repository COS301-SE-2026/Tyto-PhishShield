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

   describe('RabbitMQ event handlers', () => {
    describe('onReportSubmitted', () => {
      it('records a REPORT_SUBMITTED event with auth0Id and email', async () => {
        const payload = {
          auth0Id: 'auth0|123',
          email: 'test@example.com',
          reportId: 'rep1',
        };

        await controller.onReportSubmitted(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          auth0Id: payload.auth0Id,
          email: payload.email,
          payload: payload as any,
        });
      });

      it('works when email is missing', async () => {
        // not sure why this would happen but just in case
        const payload = {
          auth0Id: 'auth0|456',
          reportId: 'rep2',
        };

        await controller.onReportSubmitted(payload);

        expect(service.recordEvent).toHaveBeenCalledWith({
          eventType: AnalyticsEventType.REPORT_SUBMITTED,
          auth0Id: payload.auth0Id,
          email: undefined,
          payload: payload as any,
        });
      });
    });

        describe('onXpGiven', () => {
          it('records XP_GIVEN and REPORT_CONFIRMED when reason contains "phishing"', async () => {
            const payload = {
              auth0Id: 'auth0|123',
              amount: 10,
              reason: 'Valid phishing report',
            };
    
            await controller.onXpGiven(payload);
    
            expect(service.recordEvent).toHaveBeenCalledTimes(2);
            expect(service.recordEvent).toHaveBeenNthCalledWith(1, {
              eventType: AnalyticsEventType.XP_GIVEN,
              auth0Id: payload.auth0Id,
              payload: payload as any,
            });
            expect(service.recordEvent).toHaveBeenNthCalledWith(2, {
              eventType: AnalyticsEventType.REPORT_CONFIRMED,
              auth0Id: payload.auth0Id,
              payload: payload as any,
            });
          });
    
          it('records only XP_GIVEN when reason does not include "phishing"', async () => {
            const payload = {
              auth0Id: 'auth0|123',
              amount: 10,
              reason: 'Passed education assignment',
            };
    
            await controller.onXpGiven(payload);
    
            expect(service.recordEvent).toHaveBeenCalledTimes(1);
            expect(service.recordEvent).toHaveBeenCalledWith({
              eventType: AnalyticsEventType.XP_GIVEN,
              auth0Id: payload.auth0Id,
              payload: payload as any,
            });
          });
    
          it('records only XP_GIVEN when reason is missing', async () => {
            const payload = {
              auth0Id: 'auth0|123',
              amount: 10,
            };
    
            await controller.onXpGiven(payload);
    
            expect(service.recordEvent).toHaveBeenCalledTimes(1);
          });
        });

});
  

});