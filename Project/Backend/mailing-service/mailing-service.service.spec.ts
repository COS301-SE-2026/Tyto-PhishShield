import { Test, TestingModule } from '@nestjs/testing';
import { MailingServiceService } from './mailing-service.service';

describe('MailingServiceService', () => {
  let service: MailingServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailingServiceService],
    }).compile();

    service = module.get<MailingServiceService>(MailingServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
