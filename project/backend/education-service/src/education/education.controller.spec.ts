// @ts-nocheck

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

const mockRequest = (auth0Id = 'auth0|123') =>
  ({
    user: { auth0Id, email: '', role: '' },
  }) as AuthenticatedRequest;
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
    service = module.get(EducationService);
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

  describe('findAllAssignments', () => {
    it('delegates to the service', () => {
      const assignments = [{ id: 'a1' }];
      service.findAllAssignments.mockReturnValue(assignments as any);

      const result = controller.findAllAssignments();
      expect(result).toBe(assignments);
      expect(service.findAllAssignments).toHaveBeenCalled();
    });
  });

  describe('createAssignment', () => {
    it('extracts authId from the request and calls the service', () => {
      const req = {
        user: { auth0Id: 'auth0|456', email: '', role: '' },
      } as any; //keeping these blanks as not needed and as extra test in test iykyk.
      const assignment = { id: 'a1' }; //linter much nicer in spec as well.
      service.createAssignment.mockReturnValue(assignment as any);

      const result = controller.createAssignment(req);
      expect(result).toBe(assignment);
      expect(service.createAssignment).toHaveBeenCalledWith('auth0|456');
    });
  });

  describe('getMyAssignment', () => {
    it('returns the current pending assignment for the user', () => {
      const req = { user: { auth0Id: 'auth0|789' } } as any;
      const assignment = { id: 'a1', questionIds: ['q1'] };
      service.getMyAssignment.mockReturnValue(assignment as any);

      const result = controller.getMyAssignment(req);
      expect(result).toBe(assignment);
      expect(service.getMyAssignment).toHaveBeenCalledWith('auth0|789');
    });
  });

  describe('getMyHistory', () => {
    it('calls the service with the authenticated user id', () => {
      const req = { user: { auth0Id: 'auth0|000' } } as any;
      const history = [{ id: 'a1' }, { id: 'a2' }];
      service.getMyHistory.mockReturnValue(history as any);

      const result = controller.getMyHistory(req);
      expect(result).toBe(history);
      expect(service.getMyHistory).toHaveBeenCalledWith('auth0|000');
    });
  });

  describe('submitAnswers', () => {
    it('forwards the dto and auth0Id to the service', () => {
      const req = { user: { auth0Id: 'auth0|111' } } as any;
      const dto: SubmitAnswersDto = {
        assignmentId: 'a1',
        answers: [1, 0],
      };
      const resultPayload = { passed: true, xpAwarded: 10 };
      service.submitAnswers.mockReturnValue(resultPayload as any);

      const result = controller.submitAnswers(req, dto);
      expect(result).toBe(resultPayload);
      expect(service.submitAnswers).toHaveBeenCalledWith('auth0|111', dto);
    });
  });

  describe('getHistoryTcp', () => {
    it('calls getMyHistory on the service with the given auth0Id', () => {
      const history = [{ id: 'a1' }];
      service.getMyHistory.mockReturnValue(history as any);

      const result = controller.getHistoryTcp('auth0|tcp');
      expect(result).toBe(history);
      expect(service.getMyHistory).toHaveBeenCalledWith('auth0|tcp');
    });
  });
});
