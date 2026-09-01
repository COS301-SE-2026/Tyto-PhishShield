import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ProxyService } from './proxy.service';
import type { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { RouteResolver } from './proxy.routes';
import { ClientProxy } from '@nestjs/microservices';

const axiosOf = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as never,
});

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: jest.Mocked<HttpService>;
  const mockClient = (): ClientProxy => ({
    connect: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    emit: jest.fn(),
  } as any);
  const config = {
      getOrThrow: jest.fn((key: string) => {
          switch(key) {
              case 'ACCOUNTS_SERVICE_URL': return 'accounts';
              case 'EDUCATION_SERVICE_URL': return 'education';
              case 'MAILING_SERVICE_URL': return 'mailing';
              case 'REPORT_SERVICE_URL': return 'report';
              case 'XP_SERVICE_URL': return 'xp';
              case 'SERVER_DOMAIN': return 'domain';
              default: throw Error('unexpected key');
          }
      })
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: HttpService, useValue: { request: jest.fn() } },
        { provide: ConfigService, useValue: config},
        { provide: RouteResolver, useValue: {resolve: jest.fn() }}, 
        { provide: 'ACCOUNTS_SERVICE', useValue: mockClient() },
        { provide: 'MAILING_SERVICE', useValue: mockClient() },
        { provide: 'XP_SERVICE', useValue: mockClient() },
        { provide: 'REPORT_SERVICE', useValue: mockClient() },
        { provide: 'EDUCATION_SERVICE', useValue: mockClient() },
        { provide: 'ANALYTICS_SERVICE', useValue: mockClient() },
        { provide: 'LLM_SERVICE', useValue: mockClient() },
        { provide: 'COMPANY_SERVICE', useValue: mockClient() },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get(HttpService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('forward()', () => {
    it('should return data from the downstream service', async () => {
      const responseData = { message: 'Registration successful', userId: 'uuid-123' };
      httpService.request.mockReturnValueOnce(of(axiosOf(responseData)));

      const result = await service.forward({
        url: 'http://accounts-service/api/auth/register',
        method: 'POST',
        data: { email: 'test@example.com' },
      });

      expect(result).toEqual(responseData);
    });

    it('should call HttpService with the correct url, method and data', async () => {
      httpService.request.mockReturnValueOnce(of(axiosOf({ success: true })));

      await service.forward({
        url: 'http://accounts-service/api/auth/login',
        method: 'POST',
        data: { email: 'test@example.com', password: 'Password123!' },
        headers: { 'X-Custom': 'value' },
      });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://accounts-service/api/auth/login',
          method: 'POST',
          data: { email: 'test@example.com', password: 'Password123!' },
          headers: { 'X-Custom': 'value' },
        }),
      );
    });

    it('should default to empty headers when none are provided', async () => {
      httpService.request.mockReturnValueOnce(of(axiosOf({ success: true })));

      await service.forward({ url: 'http://test/api', method: 'GET' });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({ headers: {} }),
      );
    });

    it('should throw HttpException with the downstream status code', async () => {
      httpService.request.mockReturnValueOnce(
        throwError(() => ({ response: { status: 409, data: 'Conflict' } })),
      );

      await expect(
        service.forward({ url: 'http://test/api', method: 'POST' }),
      ).rejects.toThrow(HttpException);
    });

    it('should preserve the downstream status code', async () => {
      httpService.request.mockReturnValueOnce(
        throwError(() => ({ response: { status: 401, data: 'Unauthorized' } })),
      );

      try {
        await service.forward({ url: 'http://test/api', method: 'GET' });
        fail('should have thrown');
      } catch (err) {
        expect((err as HttpException).getStatus()).toBe(401);
      }
    });

    it('should throw InternalServerErrorException when downstream is unreachable', async () => {
      httpService.request.mockReturnValueOnce(
        throwError(() => new Error('Network Error')),
      );

      await expect(
        service.forward({ url: 'http://test/api', method: 'POST' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});