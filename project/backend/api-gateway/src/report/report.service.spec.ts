import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { ConfigService } from '@nestjs/config';
import { CreateReportDto } from './dto/create-report.dto';

describe('ReportService', () => {
  let service: ReportService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) =>
      key === 'FIVEGUYS_DOMAIN' ? 'phish.com' : '',
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should detect phishing and award XP', () => {
    const report: CreateReportDto = {
      subject: 'Test subject',
      from: 'test@phish.com',
      senderName: 'Test name',
      itemId: '1',
      internetMessageId: 'id1',
      dateTimeCreated: new Date().toISOString(),
      dateReported: new Date().toISOString(),
      body: 'Test body',
      source: 'outlook-addin',
    };

    const result = service.save(report, 'user1');
    expect(result.notification).toBe('phishing email detected');
    expect(service.getUserXp('user1').xp).toBe(10);
  });

  it('should not award XP for safe emails', () => {
    const report: CreateReportDto = {
      subject: 'Test subject',
      from: 'test@safe.com',
      senderName: 'Test name',
      itemId: '2',
      internetMessageId: 'id2',
      dateTimeCreated: new Date().toISOString(),
      dateReported: new Date().toISOString(),
      body: 'Test body',
      source: 'outlook-addin',
    };

    const result = service.save(report, 'user1');
    expect(result.notification).toBe('not a phishing email');
    expect(service.getUserXp('user1').xp).toBe(0);
  });
});
