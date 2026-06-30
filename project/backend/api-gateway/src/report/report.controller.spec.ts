import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ProxyService } from '../proxy/proxy.service';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

describe('ReportController', () => {
  let controller: ReportController;
  let proxyService: jest.Mocked<ProxyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({

      controllers: [ReportController],
      providers: [
        {
          
          provide: ProxyService,
          useValue: { forward: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REPORT_SERVICE_URL') return 'http://report-service:3004';

              return null;
            }),
          },
        },
      ],
    }).compile();

    
    controller = module.get<ReportController>(ReportController);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => jest.clearAllMocks());

  const mockUser: GatewayUser = {
    auth0Id: 'auth0|abc123',

    email: 'test@example.com',
    role: 'user',
  };

  const mockReq = {

    user: mockUser,
    headers: { authorization: 'Bearer test-token' },
  } as never;

  describe('create()', () => {
    it('should proxy a POST request to the report service with auth header', async () => {
      const body = { outlookMessageId: 'msg-1', emailSubject: 'Test' };
      const expectedResponse = { id: 'uuid', ...body };
      proxyService.forward.mockResolvedValue(expectedResponse);



      const result = await controller.create(mockReq, body);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://report-service:3004/api/report',
        method: 'POST',
        data: body,
        headers: { Authorization: 'Bearer test-token' },
      });


      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findAll()', () => {
    it('should proxy a GET request to fetch all reports', async () => {
      const expectedResponse = [{ id: '1' }, { id: '2' }];
      proxyService.forward.mockResolvedValue(expectedResponse);



      const result = await controller.findAll(mockReq);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://report-service:3004/api/report',
        method: 'GET',
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getMyReports()', () => {
    it('should proxy a GET request to /report/mine', async () => {
      const expectedResponse = [{ id: 'my-report' }];
      proxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.getMyReports(mockReq);


      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://report-service:3004/api/report/mine',
        method: 'GET',
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findOne()', () => {
    it('should proxy a GET request to /report/:id', async () => {
      const expectedResponse = { id: 'some-uuid', emailSubject: 'Hello' };

      proxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.findOne('some-uuid', mockReq);


      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://report-service:3004/api/report/some-uuid',
        method: 'GET',
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateStatus()', () => {
    it('should proxy a PATCH request to /report/:id/status', async () => {
      const body = { status: 'reviewed' };
      const expectedResponse = { id: 'some-uuid', status: 'reviewed' };
      proxyService.forward.mockResolvedValue(expectedResponse);

      const result = await controller.updateStatus('some-uuid', mockReq, body);

      expect(proxyService.forward).toHaveBeenCalledWith({
        url: 'http://report-service:3004/api/report/some-uuid/status',
        method: 'PATCH',
        data: body,
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result).toEqual(expectedResponse);


    });
  });



});