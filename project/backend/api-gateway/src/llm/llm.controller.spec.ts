import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';

describe('LlmController', () => {
  let controller: LlmController;
  let proxyService: jest.Mocked<ProxyService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [
         { provide: ProxyService, useValue: { forward: jest.fn(), beterForward: jest.fn() } },
         {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => {return 'envVariable'}),
            getOrThrow: jest.fn(() => {return 'envVariable'})
          },
         },
      ]
    }).compile();

    controller = module.get<LlmController>(LlmController);
    proxyService = module.get(ProxyService);
    config = module.get(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Expect proxyService to be called with', () => {
    const mockReq = {
      headers: {
          authorization: 'Bearer test-token',
      },
    };

    const mockBody = {
      topic: 'fiveguys',
    }

    const expectedBody = {
      model: config.get(''),
      messages: [{
        role: 'user',
        content: `
          Generate a convincing email html body based on the topic below where any variables listed below are just printed as \${{variable name}}. 
          Variables: 
            Reciever's name
            Sender's name
          Topic:
            ${mockBody.topic}
        `,
      }]
    }

    controller.generateEmail(mockReq as never, mockBody);

    expect(proxyService.forward).toHaveBeenCalledWith({
      method: 'POST',
      url: `${config.get('')}/api/llm-gateway/chat`,
      headers: mockReq.headers,
      data: expectedBody
    })
  });
});
