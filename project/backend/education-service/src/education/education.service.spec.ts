/**
 * @file Unit tests for EducationService.
 *
 * Covers question management, assignment creation, retrieval,
 * answer submission, and XP event publishing.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        questionText: 'What is 2+2?',// a tough question for testing of course.
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
      const questions = [{ id: 'q1' }, { id: 'q2' }];// will this work, do we have 2 questions here or will it not work?...
      questionRepo.find.mockResolvedValue(questions as any);//will linter allow me this?

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
      { id: 'q5' },//lets test here with 5 questins, see what happens.
    ];

    it('creates a new assignment when no pending assignment exists', async () => {
      assignmentRepo.findOne.mockResolvedValue(null);
      questionRepo.find.mockResolvedValue(questions as any);
      assignmentRepo.create.mockImplementation((data) => data as any);
      assignmentRepo.save.mockImplementation((a) => Promise.resolve(a as any));

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
  
      it('returns the assignment with questions', async () => {// also make sure that it gives assignment id.
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