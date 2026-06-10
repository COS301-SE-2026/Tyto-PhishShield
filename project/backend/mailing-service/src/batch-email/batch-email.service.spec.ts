import { Test, TestingModule } from '@nestjs/testing';
import { BatchEmailService } from './batch-email.service';

describe('BatchEmailService', () => {
  let service: BatchEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BatchEmailService],
    }).compile();

    service = module.get<BatchEmailService>(BatchEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
