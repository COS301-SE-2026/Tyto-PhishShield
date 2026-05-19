import { Test, TestingModule } from '@nestjs/testing';
import { MailingServiceController } from '../src/mailing-service.controller';
import { MailingServiceService } from '../src/mailing-service.service';

describe('MailingServiceController', () => {
  let controller: MailingServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailingServiceController],
      providers: [MailingServiceService],
    }).compile();

    controller = module.get<MailingServiceController>(MailingServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
