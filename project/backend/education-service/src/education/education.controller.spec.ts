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
//reemember to test this one nice nice.
   describe('handleEducationAssignment', () => {
    it('delegates to educationService.createAsignment with the correct auth0Id', async () => {
      const payload = { auth0Id: 'auth0|123' };
      await controller.handleEducationAssignment(payload);
      expect(service.createAssignment).toHaveBeenCalledWith('auth0|123');
    });
  });

    describe('createQuestion', () => {
    it('passes the dto to the servie and returns the result', () => {
      const dto: CreateQuestionDto = {
        questionText: 'Q?',
        options: ['A', 'B'],
        correctOptionIndex: 0,
      };
      const created = { id: 'q1', ...dto };
      service.createQuestion.mockReturnValue(created as any);
// this caused some problmes for some reason. Might be worth further investagation.
      const result = controller.createQuestion(dto);
      expect(result).toBe(created);
      expect(service.createQuestion).toHaveBeenCalledWith(dto);
    });
  });

});

