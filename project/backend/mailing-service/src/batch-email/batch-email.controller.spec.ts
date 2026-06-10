import { Test, TestingModule } from '@nestjs/testing';
import { BatchEmailController } from './batch-email.controller';

describe('BatchEmailController', () => {
  let controller: BatchEmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchEmailController],
    }).compile();

    controller = module.get<BatchEmailController>(BatchEmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
