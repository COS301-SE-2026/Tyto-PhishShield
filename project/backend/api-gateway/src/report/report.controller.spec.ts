import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';

describe('ReportController', () => {
  let controller: ReportController;
  let service: ReportService;

  const mockReportService = {
    save: jest.fn(),
    findAll: jest.fn(),
    getUserXp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: mockReportService }],
    }).compile();

    controller = module.get<ReportController>(ReportController);
    service = module.get<ReportService>(ReportService);
  });

  it('should call service.save with correct user ID', () => {
    const mockReq = { user: { auth0Id: 'user123' } } as any;
    const dto: CreateReportDto = {
      subject: 'Test',
      from: 'test@test.com',
      senderName: 'Test',
      itemId: '1',
      internetMessageId: '1',
      dateTimeCreated: new Date().toISOString(),
      dateReported: new Date().toISOString(),
      body: 'Test',
      source: 'outlook-addin',
    };

    controller.createReport(mockReq, dto);
    expect(service.save).toHaveBeenCalledWith(dto, 'user123');
  });

  it('should return all reports', () => {
    const reports = [{ subject: 'Test' }];
    mockReportService.findAll.mockReturnValue(reports);
    expect(controller.getAllReports()).toEqual(reports);
  });
});
