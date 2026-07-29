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
    it('returns all questions ordered by createdAt desc', async () => {
      const questions = [{ id: 'q1' }, { id: 'q2' }];// will this work, do we have 2 questions here or will it not work?...
      questionRepo.find.mockResolvedValue(questions as any);//will linter allow me this?

      const result = await service.findAllQuestions();
      expect(result).toEqual(questions);
      expect(questionRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });