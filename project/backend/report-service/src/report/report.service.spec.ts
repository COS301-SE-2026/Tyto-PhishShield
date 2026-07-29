/**
 * @file Unit tests for ReportService.
 *
 * Covers report creation, duplicate detection, phishing‑simulation
 * detection, status updates, and the recording of sent phishing emails.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import { ReportService } from './report.service';
import { Report, ReportStatus } from './entities/report.entity';
import { Reportable } from './entities/reportable.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

interface ReporterUser {
  //add this on revision of the service.
  auth0Id: string;
  email: string;
  role: string;
}

const mockReportRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockReportableRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

const mockAmqpConnection = {
  publish: jest.fn(),
};

const reporter: ReporterUser = {
  auth0Id: 'auth0|123',
  email: 'user@example.com',
  role: 'user',
};

describe('ReportService', () => {
  let service: ReportService;
  let reportRepo: jest.Mocked<typeof mockReportRepo>;
  let reportableRepo: jest.Mocked<typeof mockReportableRepo>;
  let amqpConnection: jest.Mocked<typeof mockAmqpConnection>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: getRepositoryToken(Report), useValue: mockReportRepo },
        {
          provide: getRepositoryToken(Reportable),
          useValue: mockReportableRepo,
        },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    reportRepo = module.get(getRepositoryToken(Report));
    reportableRepo = module.get(getRepositoryToken(Reportable));
    amqpConnection = module.get(AmqpConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordSentEmail', () => {
    const payload = {
      recipient: 'target@example.com',
      referenceNumber: 'ref-001',
      scheduledAt: '2026-01-01T00:00:00Z',
    };

    it('creates a Reportble if the reference number does not exist', async () => {
      // this is essential.
      reportableRepo.findOne.mockResolvedValue(null);
      reportableRepo.create.mockImplementation((data) => data);
      reportableRepo.save.mockResolvedValue(undefined);

      await service.recordSentEmail(payload);

      expect(reportableRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceNumber: 'ref-001',

          recipient: 'target@example.com',
          sentAt: expect.any(Date),
        }),
      );
      expect(reportableRepo.save).toHaveBeenCalled();
    });

    it('does nothing if the reference number already exists', async () => {
      reportableRepo.findOne.mockResolvedValue({ id: '1' } as any);

      await service.recordSentEmail(payload);

      expect(reportableRepo.create).not.toHaveBeenCalled();
      expect(reportableRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto: CreateReportDto = {
      outlookMessageId: 'msg-001',
      emailSubject: 'Suspicious mail',

      emailSender: 'phish@example.com',
      emailBody: 'Click here...',
      emailReceivedAt: '2026-01-01T12:00:00Z',
      notes: 'Looks fishy',
    };

    const newReport = {
      id: 'r1',
      ...dto,
      auth0Id: reporter.auth0Id,
      reporterEmail: reporter.email,
      status: ReportStatus.PENDING,
      emailReceivedAt: new Date(dto.emailReceivedAt!),
    };

    beforeEach(() => {
      reportRepo.findOne.mockResolvedValue(null); // no duplicate
      reportRepo.create.mockImplementation((data) => data);

      reportRepo.save.mockImplementation((r) => Promise.resolve(r));
      amqpConnection.publish.mockResolvedValue(undefined);
    });

    it('creates and saves a report with PENDING status', async () => {
      const result = await service.create(reporter, dto);
      expect(result.status).toBe(ReportStatus.PENDING);
      expect(reportRepo.save).toHaveBeenCalled(); //whoo finnlay
    });

    it('throws ConflictException on duplicate report', async () => {
      reportRepo.findOne.mockResolvedValue({ id: 'existing' } as any);
      await expect(service.create(reporter, dto)).rejects.toThrow();
    });

    it('sets CONFIRMED_PHISHING and awards XP when sender is simulation domain', async () => {
      const simDto = {
        ...dto,
        emailSender: 'sim@capstone-five-guys.dns.net.za',
      };
      const result = await service.create(reporter, simDto);
      expect(result.status).toBe(ReportStatus.CONFIRMED_PHISHING); //ask Nico about this one.

      expect(amqpConnection.publish).toHaveBeenCalledWith(
        'xp-event-exchange',
        'xp.give',
        expect.objectContaining({ auth0Id: reporter.auth0Id, amount: 10 }),
      );
    });

    it('publishes education.assign when sender is not a simulation', async () => {
      await service.create(reporter, dto);
      expect(amqpConnection.publish).toHaveBeenCalledWith(
        'education-event-exchange', // we must have this working by demo 2.
        'education.assign',
        expect.objectContaining({ auth0Id: reporter.auth0Id }),
      );
    });

    it('logs an eror but does not throw if AMQP publish fails', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      amqpConnection.publish.mockRejectedValue(new Error('broker down'));

      const result = await service.create(reporter, dto);

      expect(result).toBeTruthy();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });
});
