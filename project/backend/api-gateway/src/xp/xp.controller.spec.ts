import { Test, TestingModule } from '@nestjs/testing';
import { XpController } from './xp.controller';

describe('XpController', () => {
  let controller: XpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XpController],
    }).compile();

    controller = module.get<XpController>(XpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
