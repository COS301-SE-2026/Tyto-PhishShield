import { Test, TestingModule } from '@nestjs/testing';
import { XpWebsocketController } from './xp-websocket.controller';

describe('XpWebsocketController', () => {
  let controller: XpWebsocketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XpWebsocketController],
    }).compile();

    controller = module.get<XpWebsocketController>(XpWebsocketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
