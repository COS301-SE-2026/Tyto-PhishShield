import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { EducationService } from './education.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { auth0Id: string; email: string; role: string };
}

@ApiTags('Education')
@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Post('questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a question to the bank(admin)' })
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.educationService.createQuestion(dto);
  }

  @Get('questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all questions (admin/debug)' })
  findAllQuestions() {
    return this.educationService.findAllQuestions();
  }

  @Get('assignments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all assignments (admin)' })
  findAllAssignments() {
    return this.educationService.findAllAssignments();
  }

  @Post('assignments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create an education assignment for the current user',
  })
  createAssignment(@Req() req: AuthenticatedRequest) {
    return this.educationService.createAssignment(req.user.auth0Id);
  }

  @Get('assignment/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the current pending assignment (with questions, no answers)',
  })
  getMyAssignment(@Req() req: AuthenticatedRequest) {
    return this.educationService.getMyAssignment(req.user.auth0Id);
  }

  @Get('history/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user assignment history' })
  getMyHistory(@Req() req: AuthenticatedRequest) {
    return this.educationService.getMyHistory(req.user.auth0Id);
  }

  @Post('answers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit answers for a pending assignment' })
  submitAnswers(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.educationService.submitAnswers(req.user.auth0Id, dto);
  }

  @MessagePattern('education.getHistory')
  getHistoryTcp(auth0Id: string) {
    return this.educationService.getMyHistory(auth0Id);
  }
}
