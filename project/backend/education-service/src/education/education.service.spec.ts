/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * @file Unit tests for EducationService.
 *
 * Covers question management, assignment creation, retrieval,
 * answer submission, and XP event publishing.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EducationService } from './education.service';
import { Question } from './entities/question.entity';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

const mockQuestionRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findByIds: jest.fn(),
};

const mockAssignmentRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockAmqpConnection = {
  publish: jest.fn(),
};

describe('EducationService', () => {
  let service: EducationService;
  let questionRepo: jest.Mocked<typeof mockQuestionRepo>;
  let assignmentRepo: jest.Mocked<typeof mockAssignmentRepo>;
  let amqpConnection: jest.Mocked<typeof mockAmqpConnection>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationService,
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepo },
        {
          provide: getRepositoryToken(Assignment),
          useValue: mockAssignmentRepo,
        },
        { provide: AmqpConnection, useValue: mockAmqpConnection },
      ],
    }).compile();

    service = module.get<EducationService>(EducationService);
    questionRepo = module.get(getRepositoryToken(Question));
    assignmentRepo = module.get(getRepositoryToken(Assignment));
    amqpConnection = module.get(AmqpConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuestion', () => {
    const dto: CreateQuestionDto = {
      questionText: 'What is 2+2?', // a tough question for testing of course.
      options: ['3', '4', '5'],
      correctOptionIndex: 1,
    };

    it('creates and saves a question when correctOptionIndex is valid', async () => {
      const savedQuestion = { id: 'q1', ...dto, createdAt: new Date() };
      questionRepo.create.mockReturnValue(savedQuestion as any);
      questionRepo.save.mockResolvedValue(savedQuestion as any);

      const result = await service.createQuestion(dto);
      expect(result).toEqual(savedQuestion);
      expect(questionRepo.create).toHaveBeenCalledWith(dto);
      expect(questionRepo.save).toHaveBeenCalledWith(savedQuestion);
    });

    it('throws BadRequestException when correctOptionIndex is out of bounds', async () => {
      const invalidDto = { ...dto, correctOptionIndex: 5 };
      await expect(service.createQuestion(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllQuestions', () => {
    it('returns all qestions ordered by createdAt desc', async () => {
      const questions = [{ id: 'q1' }, { id: 'q2' }]; // will this work, do we have 2 questions here or will it not work?...
      questionRepo.find.mockResolvedValue(questions as any); //will linter allow me this?

      const result = await service.findAllQuestions();
      expect(result).toEqual(questions);
      expect(questionRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('createAssignment', () => {
    const auth0Id = 'auth0|123';
    const questions = [
      { id: 'q1' },
      { id: 'q2' },
      { id: 'q3' },
      { id: 'q4' },
      { id: 'q5' }, //lets test here with 5 questins, see what happens.
    ];

    it('creates a new assignment when no pending assignment exists', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      questionRepo.find.mockResolvedValue(questions as any);
      assignmentRepo.create.mockImplementation((data) => data);
      assignmentRepo.save.mockResolvedValue({
  auth0Id,
  questionIds: ['q1', 'q2', 'q3'],
  status: AssignmentStatus.PENDING,
} as Assignment);

      const result = await service.createAssignment(auth0Id);

      expect(result.auth0Id).toBe(auth0Id);
      expect(result.questionIds).toHaveLength(3);
      expect(result.status).toBe(AssignmentStatus.PENDING);
      expect(assignmentRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when a pendng assignment already exists', async () => {
      assignmentRepo.findOne.mockResolvedValue({ id: 'a1' } as any);

      await expect(service.createAssignment(auth0Id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws BadRequestExceptoon when no questions exist in the database', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      questionRepo.find.mockResolvedValue([]);

      await expect(service.createAssignment(auth0Id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMyAssignment', () => {
    const auth0Id = 'auth0|123';

    it('returns the assignment with questions', async () => {
      // also make sure that it gives assignment id.
      const assignment = {
        id: 'a1',
        auth0Id,
        questionIds: ['q1', 'q2'],
        status: AssignmentStatus.PENDING,
        createdAt: new Date(),
      };
      const questions = [
        {
          id: 'q1',
          questionText: 'Q1',
          options: ['A', 'B'],
          correctOptionIndex: 0,
          createdAt: new Date(),
        },
        {
          id: 'q2',
          questionText: 'Q2',
          options: ['C', 'D'],
          correctOptionIndex: 1,
          createdAt: new Date(),
        },
      ];

      assignmentRepo.findOne.mockResolvedValue(assignment as any);
      questionRepo.findByIds.mockResolvedValue(questions as any);

      const result = await service.getMyAssignment(auth0Id);
      expect(result).toBeTruthy();
      expect(result!.questions).toHaveLength(2);
      expect(result!.questions[0]).not.toHaveProperty('correctOptionIndex');
    });

    it('returns nul when no pending assignment exists', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);

      const result = await service.getMyAssignment(auth0Id);
      expect(result).toBeNull();
    });
  });

  describe('getMyHistory', () => {
    it('returns all assignments for the given user orered by createdAt desc', async () => {
      const assignments = [{ id: 'a1' }, { id: 'a2' }];
      assignmentRepo.find.mockResolvedValue(assignments as any);

      const result = await service.getMyHistory('auth0|123'); //this one should be easy.
      expect(result).toEqual(assignments);
      expect(assignmentRepo.find).toHaveBeenCalledWith({
        where: { auth0Id: 'auth0|123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('submitAnswers', () => {
    const auth0Id = 'auth0|123';
    const assignment = {
      id: 'a1',
      auth0Id,
      questionIds: ['q1', 'q2'],
      status: AssignmentStatus.PENDING, //this myst be pending for report eve
      xpAwarded: 0,
      completedAt: null,
    };

    const questions = [
      {
        id: 'q1',
        questionText: 'Q1',
        options: ['A', 'B'],
        correctOptionIndex: 1,
      },
      {
        id: 'q2',
        questionText: 'Q2',
        options: ['C', 'D'],
        correctOptionIndex: 0,
      },
    ];

    const dto: SubmitAnswersDto = {
      assignmentId: 'a1',
      answers: [1, 0], // both correct
    };

    beforeEach(() => {
      assignmentRepo.findOne.mockResolvedValue(assignment as any);
      questionRepo.findByIds.mockResolvedValue(questions as any);
      assignmentRepo.save.mockImplementation((a) => Promise.resolve(a));
      amqpConnection.publish.mockResolvedValue(undefined);
    });

    it('marks assignment as PASSED when score meets the threshold', async () => {
      const result = await service.submitAnswers(auth0Id, dto);
      expect(result.passed).toBe(true);
      expect(result.xpAwarded).toBe(10);
      expect(result.correctCount).toBe(2); //this seems like good numbers by the way.
      expect(assignmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AssignmentStatus.PASSED,
          xpAwarded: 10,
        }),
      );
      expect(amqpConnection.publish).toHaveBeenCalled();
    });

it('marks assignment as FAILED when score is below threshold', async () => {
  dto.answers = [0, 1]; // both wrong
  const result = await service.submitAnswers(auth0Id, dto);

  expect(result.passed).toBe(false);
  expect(result.xpAwarded).toBe(0);

  expect(assignmentRepo.save).toHaveBeenCalledWith(
    expect.objectContaining({
      status: AssignmentStatus.FAILED,
      xpAwarded: 0,
    }),
  );

  // education.completed is published even when failed
  expect(amqpConnection.publish).toHaveBeenCalledTimes(1);
  expect(amqpConnection.publish).toHaveBeenCalledWith(
    'education-event-exchange',
    'education.completed',
    {
      auth0Id: 'auth0|123',
      assignmentId: 'a1',
      passed: false,
    },
  );
});

    it('throws NotFoundException when no pending assignment exists', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      await expect(service.submitAnswers(auth0Id, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when number of answers does not match questions', async () => {
      dto.answers = [1]; // only one answer
      await expect(service.submitAnswers(auth0Id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('logs an eror but does not throw when AMQP publish fails', async () => {
      // Use correct-length answers so we get past the length check
      dto.answers = [1, 0]; // both correct, will cause publish to be called

      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => {});

      amqpConnection.publish.mockRejectedValue(new Error('broker down'));

      const result = await service.submitAnswers(auth0Id, dto);
      expect(result.passed).toBe(true);
      expect(amqpConnection.publish).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe('findAllAssignments', () => {
    it('returns all assignments ordered by createdAt desc', async () => {
      const assignments = [{ id: 'a1' }, { id: 'a2' }];
      assignmentRepo.find.mockResolvedValue(assignments as any);

      const result = await service.findAllAssignments();
      expect(result).toEqual(assignments);
      expect(assignmentRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });
});
