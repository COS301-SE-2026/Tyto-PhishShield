import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Question } from './entities/question.entity';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import * as crypto from 'crypto';

const QUESTIONS_PER_ASSIGNMENT = 3;
const PASS_THRESHOLD = 0.7;
const XP_AWARDED = 15;

@Injectable()
export class EducationService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @Inject('EDUCATION_EVENTS')
    private readonly eventsClient: ClientProxy,
  ) {}

  async createQuestion(dto: CreateQuestionDto): Promise<Question> {
    if (dto.correctOptionIndex >= dto.options.length) {
      throw new BadRequestException(
        'correctOptionIndex must be within the options array',
      );
    }
    const question = this.questionRepo.create(dto);
    return this.questionRepo.save(question);
  }

  findAllQuestions(): Promise<Question[]> {
    return this.questionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createAssignment(auth0Id: string): Promise<Assignment> {
    const existing = await this.assignmentRepo.findOne({
      where: { auth0Id, status: AssignmentStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException('You already have existing assignment');
    }

    const allQuestions = await this.questionRepo.find();
    if (allQuestions.length === 0) {
      throw new BadRequestException(
        'No questions available yet, please contact an admin',
      );
    }

    const selected = this.randomSubset(allQuestions, QUESTIONS_PER_ASSIGNMENT);

    const assignment = this.assignmentRepo.create({
      auth0Id,
      questionIds: selected.map((q) => q.id),
      status: AssignmentStatus.PENDING,
    });

    return this.assignmentRepo.save(assignment);
  }

  async getMyAssignment(
    auth0Id: string,
  ): Promise<
    (Assignment & { questions: Omit<Question, 'correctOptionIndex'>[] }) | null
  > {
    const assignment = await this.assignmentRepo.findOne({
      where: { auth0Id, status: AssignmentStatus.PENDING },
      order: { createdAt: 'DESC' },
    });

    if (!assignment) return null;

    const questions = await this.questionRepo.findByIds(assignment.questionIds);

    const sanitised = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      createdAt: q.createdAt,
    }));

    return { ...assignment, questions: sanitised };
  }

  async getMyHistory(auth0Id: string): Promise<Assignment[]> {
    return this.assignmentRepo.find({
      where: { auth0Id },
      order: { createdAt: 'DESC' },
    });
  }

  async submitAnswers(
    auth0Id: string,
    dto: SubmitAnswersDto,
  ): Promise<{
    passed: boolean;
    xpAwarded: number;
    correctCount: number;
    total: number;
    feedback: string;
  }> {
    const assignment = await this.assignmentRepo.findOne({
      where: {
        id: dto.assignmentId,
        auth0Id,
        status: AssignmentStatus.PENDING,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment nof found or already completed');
    }

    const questions = await this.questionRepo.findByIds(assignment.questionIds);

    if (dto.answers.length !== questions.length) {
      throw new BadRequestException(
        `Expected ${questions.length} answers, received ${dto.answers.length}`,
      );
    }

    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      if (dto.answers[i] === questions[i].correctOptionIndex) {
        correctCount++;
      }
    }

    const score = correctCount / questions.length;
    const passed = score >= PASS_THRESHOLD;

    assignment.status = passed
      ? AssignmentStatus.PASSED
      : AssignmentStatus.FAILED;
    assignment.xpAwarded = passed ? XP_AWARDED : 0;
    assignment.completedAt = new Date();
    await this.assignmentRepo.save(assignment);

    if (passed) {
      this.eventsClient.emit('education.completed', {
        auth0Id,
        xpAwarded: assignment.xpAwarded,
        assignmentId: assignment.id,
      });
    }

    const feedback = passed
      ? `Well done! You got ${correctCount}/${questions.length} correct and earned ${XP_AWARDED} XP back.`
      : `You got ${correctCount}/${questions.length} correct. You need ${Math.ceil(PASS_THRESHOLD * questions.length)} to pass. Try again later.`;

    return {
      passed,
      xpAwarded: assignment.xpAwarded,
      correctCount,
      total: questions.length,
      feedback,
    };
  }

  findAllAssignments(): Promise<Assignment[]> {
    return this.assignmentRepo.find({ order: { createdAt: 'DESC' } });
  }

  private randomSubset<T>(arr: T[], size: number): T[] {
    const shuffled = [...arr].sort(() => crypto.randomInt(-1, 2));
    return shuffled.slice(0, Math.min(size, arr.length));
  }
}
