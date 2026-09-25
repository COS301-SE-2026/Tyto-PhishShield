/**
 * @file Unit tests for ReportController.
 *
 * Covers all HTTP endpoints, RabbitMQ subscriber handlers,
 * and TCP message patterns. The ReportService is fully mocked.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const mockReportService = {
  recordSentEmail: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  findByUser: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
};

describe('ReportController', () => {
  let controller: ReportController;
  let service: jest.Mocked<typeof mockReportService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: mockReportService }],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RabbitMQ subscribers', () => {
    const singlePayload = {
      //lookie here and remember to use Rabbit correctly.
      recipient: 'target@example.com',

      referenceNumber: 'ref-001',
      scheduledAt: '2026-01-01T00:00:00Z',
    };
    const batchPayload = {
      entries: [
        singlePayload,
        { ...singlePayload, referenceNumber: 'ref-002' },
      ],
    };

    it('handleSingleSend delegates to recordSentEmail', async () => {
      await controller.handleSingleSend(singlePayload);

      expect(service.recordSentEmail).toHaveBeenCalledWith(singlePayload);
    });

    it('handleSingleSchedule delegates to recordSentEmail', async () => {
      // make sure with Darius on this one.
      await controller.handleSingleSchedule(singlePayload);
      expect(service.recordSentEmail).toHaveBeenCalledWith(singlePayload);
    });

    it('handleBatchSend delegates each entry to recordSentEmail', async () => {
      await controller.handleBatchSend(batchPayload);
      expect(service.recordSentEmail).toHaveBeenCalledTimes(2);
      expect(service.recordSentEmail).toHaveBeenCalledWith(
        batchPayload.entries[0],
      );

      expect(service.recordSentEmail).toHaveBeenCalledWith(
        batchPayload.entries[1],
      );
    });

    it('handleBatchSchedule delegates each entry to recordSentEmail', async () => {
      await controller.handleBatchSchedule(batchPayload);
      expect(service.recordSentEmail).toHaveBeenCalledTimes(2);
    });
  });

  const mockRequest = (
    overrides: Partial<{ auth0Id: string; email: string; role: string }> = {},
  ) =>
    ({
      user: {
        auth0Id: overrides.auth0Id || 'auth0|123',
        email: overrides.email || 'user@example.com',
        role: overrides.role || 'user',
      },
    }) as any;

  describe('POST /', () => {
    it('calls reportSrvice.create with user and dto', () => {
      //I think this is what we need here.
      const dto: CreateReportDto = {
        outlookMessageId: 'msg-001',
        emailSubject: 'Test',

        emailSender: 'test@example.com',
        emailBody: 'Body',
        emailReceivedAt: '2026-01-01T12:00:00Z',
        notes: '',
      };
      const req = mockRequest();
      const expectedResult = { id: 'r1', ...dto };
      service.create.mockReturnValue(expectedResult as any);

      const result = controller.create(req, dto);
      expect(result).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith(req.user, dto);
    });
  });

  describe('GET /', () => {
    it('delegates to reportService.findAll', () => {
      const reports = [{ id: 'r1' }, { id: 'r2' }]; // r1 and r2 gave problems earlier but not now...
      service.findAll.mockReturnValue(reports as any);
      const result = controller.findAll();

      expect(result).toEqual(reports);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /mine', () => {
    it('extracts auth0Id from request and calls findByUser', () => {
      const req = mockRequest({ auth0Id: 'auth0|456' });
      const reports = [{ id: 'r1' }];
      service.findByUser.mockReturnValue(reports as any);

      const result = controller.getMyReports(req);
      expect(result).toEqual(reports);
      expect(service.findByUser).toHaveBeenCalledWith('auth0|456');
    });
  });

  describe('GET /:id', () => {
    it('forwards the id to reportService.findById', () => {
      const report = { id: 'r1' };
      service.findById.mockReturnValue(report as any);

      const result = controller.findOne('r1');
      expect(result).toEqual(report);
      expect(service.findById).toHaveBeenCalledWith('r1'); //ok nice.
    });
  });

  describe('PATCH /:id/status', () => {
    it('pases id and dto to reportService.updateStatus', () => {
      const dto: UpdateStatusDto = { status: 'REVIEWED' as any };

      const updated = { id: 'r1', status: 'REVIEWED' };
      service.updateStatus.mockReturnValue(updated as any);

      const result = controller.updateStatus('r1', dto);
      expect(result).toEqual(updated);
      expect(service.updateStatus).toHaveBeenCalledWith('r1', dto);
    });
  });
});
