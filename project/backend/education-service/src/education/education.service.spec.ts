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