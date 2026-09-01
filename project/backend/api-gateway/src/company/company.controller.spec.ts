import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';

describe('CompanyController', () => {
  let controller: CompanyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {provide: ProxyService, useValue: {
        forward: jest.fn(),
        beterForward: jest.fn(),
        sendTcpMessage: jest.fn(),}},
        {provide: ConfigService, useValue: { get: (path: string) => ('COMPANY_SERVICE_URL')}}
      ]
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
