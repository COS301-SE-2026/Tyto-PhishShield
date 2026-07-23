import { Test, TestingModule } from '@nestjs/testing';
import { XpWebsocketController } from './xp-websocket.controller';
import { XpWebsocketGateway } from './xp-websocket.gateway';

describe('XpWebsocketController', () => {
  let controller: XpWebsocketController;
  let gateway: jest.Mocked<XpWebsocketGateway>;

  beforeEach(async () => {
    const gatewayMock = {
      emitXpUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [XpWebsocketController],
      providers: [{ provide: XpWebsocketGateway, useValue: gatewayMock }],
    }).compile();

    controller = module.get<XpWebsocketController>(XpWebsocketController);
    gateway = module.get(XpWebsocketGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleXpGiven', () => {
    it('forwards the auth0Id and amount from the rabbit message to the gateway', () => {
      const message = { auth0Id: 'auth0|123456789', amount: 50 };

      controller.handleXpGiven(message);

      expect(gateway.emitXpUpdate).toHaveBeenCalledTimes(1);
      expect(gateway.emitXpUpdate).toHaveBeenCalledWith(
        message.auth0Id,
        message.amount,
      );
    });

    it('does not transform or reorder the payload fields', () => {
      const message = { auth0Id: 'auth0|other-user', amount: 0 };

      controller.handleXpGiven(message);

      expect(gateway.emitXpUpdate).toHaveBeenCalledWith('auth0|other-user', 0);
    });
  });
});
