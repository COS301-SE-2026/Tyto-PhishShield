/**
 * Delegation tests for CommsController.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CommsController } from './comms.controller';
import { CommsService } from './comms.service';

const mockService = {
  getGraph: jest.fn(),
};

describe('CommsController', () => {
  let controller: CommsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommsController],
      providers: [{ provide: CommsService, useValue: mockService }],
    }).compile();

    controller = module.get(CommsController);
  });

  it('parses 7d to 7 days', async () => {
    mockService.getGraph.mockResolvedValue({ nodes: [], edges: [] });
    await controller.getGraph('7d');
    expect(mockService.getGraph).toHaveBeenCalledWith(7);
  });

  it('parses 90d to 90 days', async () => {
    mockService.getGraph.mockResolvedValue({ nodes: [], edges: [] });
    await controller.getGraph('90d');
    expect(mockService.getGraph).toHaveBeenCalledWith(90);
  });

  it('defaults to 30 days when period is missing or unrecognised', async () => {
    mockService.getGraph.mockResolvedValue({ nodes: [], edges: [] });
    await controller.getGraph(undefined);
    await controller.getGraph('gibberish');
    expect(mockService.getGraph).toHaveBeenNthCalledWith(1, 30);
    expect(mockService.getGraph).toHaveBeenNthCalledWith(2, 30);
  });
});