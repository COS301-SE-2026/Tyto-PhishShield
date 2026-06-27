import { Test, TestingModule } from '@nestjs/testing';
import { XpService } from './xp.service';

describe('XpService', () => {
  let service: XpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XpService],
    }).compile();

    service = module.get<XpService>(XpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
