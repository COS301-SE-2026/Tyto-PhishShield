import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { XpController } from './xp.controller';
import { ProxyService } from '../proxy/proxy.service';
import { GiveXpDto } from './dto/give-xp.dto';

describe('XpController', () => {
  let controller: XpController;
  let proxy: jest.Mocked<ProxyService>;
  let config: jest.Mocked<ConfigService>;

  const XP_SERVICE_URL = 'http://localhost:3005';

  beforeEach(async () => {
    const proxyMock = {
      forward: jest.fn(),
    };

    const configMock = {
      get: jest.fn().mockReturnValue(XP_SERVICE_URL),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [XpController],
      providers: [
        { provide: ProxyService, useValue: proxyMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    controller = module.get<XpController>(XpController);
    proxy = module.get(ProxyService);
    config = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('reads XP_SERVICE_URL from ConfigService with a fallback default', () => {
    expect(config.get).toHaveBeenCalledWith(
      'XP_SERVICE_URL',
      'http://localhost:3005',
    );
  });

  describe('giveXp', () => {
    it('forwards a POST request to /xp with the request body', async () => {
      const dto: GiveXpDto = { auth0Id: 'auth0|123456789', amount: 50 } as GiveXpDto;
      const expected = { success: true };
      proxy.forward.mockResolvedValue(expected);

      const result = await controller.giveXp(dto);

      expect(proxy.forward).toHaveBeenCalledTimes(1);
      expect(proxy.forward).toHaveBeenCalledWith({
        url: `${XP_SERVICE_URL}/xp`,
        method: 'POST',
        data: dto,
      });
      expect(result).toBe(expected);
    });
  });

  describe('getAllXp', () => {
    it('forwards a GET request to /xp', async () => {
      const expected = [{ auth0Id: 'auth0|1', amount: 10 }];
      proxy.forward.mockResolvedValue(expected);

      const result = await controller.getAllXp();

      expect(proxy.forward).toHaveBeenCalledWith({
        url: `${XP_SERVICE_URL}/xp`,
        method: 'GET',
      });
      expect(result).toBe(expected);
    });
  });

  describe('getNetXpAllUsers', () => {
    it('forwards a GET request to /xp/net', async () => {
      const expected = [{ auth0Id: 'auth0|1', net: 100 }];
      proxy.forward.mockResolvedValue(expected);

      const result = await controller.getNetXpAllUsers();

      expect(proxy.forward).toHaveBeenCalledWith({
        url: `${XP_SERVICE_URL}/xp/net`,
        method: 'GET',
      });
      expect(result).toBe(expected);
    });
  });

  describe('getXpByUser', () => {
    it('forwards a GET request to /xp/:auth0Id', async () => {
      const auth0Id = 'auth0|123456789';
      const expected = [{ auth0Id, amount: 20 }];
      proxy.forward.mockResolvedValue(expected);

      const result = await controller.getXpByUser(auth0Id);

      expect(proxy.forward).toHaveBeenCalledWith({
        url: `${XP_SERVICE_URL}/xp/${auth0Id}`,
        method: 'GET',
      });
      expect(result).toBe(expected);
    });

    it('URL-encodes/interpolates whatever auth0Id it is given, without validating it', async () => {
      const auth0Id = 'auth0|weird id with spaces';
      proxy.forward.mockResolvedValue({});

      await controller.getXpByUser(auth0Id);

      expect(proxy.forward).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${XP_SERVICE_URL}/xp/${auth0Id}`,
        }),
      );
    });
  });

  describe('getNetXpByUser', () => {
    it('forwards a GET request to /xp/:auth0Id/net', async () => {
      const auth0Id = 'auth0|123456789';
      const expected = { auth0Id, net: 300 };
      proxy.forward.mockResolvedValue(expected);

      const result = await controller.getNetXpByUser(auth0Id);

      expect(proxy.forward).toHaveBeenCalledWith({
        url: `${XP_SERVICE_URL}/xp/${auth0Id}/net`,
        method: 'GET',
      });
      expect(result).toBe(expected);
    });
  });

  describe('error propagation', () => {
    it('propagates errors thrown by ProxyService instead of swallowing them', async () => {
      const error = new Error('xp-service unreachable');
      proxy.forward.mockRejectedValue(error);

      await expect(controller.getAllXp()).rejects.toThrow('xp-service unreachable');
    });
  });
});