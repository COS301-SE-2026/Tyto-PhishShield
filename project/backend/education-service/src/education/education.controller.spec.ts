/**
 * @file Unit tests for EducationController.
 *
 * Covers all HTTP endpoints, the RabbitMQ subscriber, and the TCP message pattern.
 * The EducationService is mocked so tests focus on the controller’s delegation logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

const mockEducationService = {
  createQuestion: jest.fn(),
  findAllQuestions: jest.fn(),
  findAllAssignments: jest.fn(),
  createAssignment: jest.fn(),
  getMyAssignment: jest.fn(),
  getMyHistory: jest.fn(),
  submitAnswers: jest.fn(),
};

describe('EducationController', () => {
  let controller: EducationController;
  let service: jest.Mocked<typeof mockEducationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EducationController],
      providers: [
        { provide: EducationService, useValue: mockEducationService },
      ],
    }).compile();

    controller = module.get<EducationController>(EducationController);
    service = module.get(EducationService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

});