import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { EducationService } from './education.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

interface AuthenticatedRequest extends Request {
  user: { auth0Id: string; email: string; role: string };
}

@ApiTags('Education')
@Controller('education')
export class EducationController {
  private readonly logger = new Logger(EducationController.name);
  constructor(private readonly educationService: EducationService) {}

  @RabbitSubscribe({
    // this is crucial to communicate with the other service.
    exchange: 'education-event-exchange',
    routingKey: 'education.assign',
    queue: 'education-service-assign-queue',
  })
  async handleEducationAssignment(payload: { auth0Id: string }) {
    this.logger.log(`Received education.assign for user ${payload.auth0Id}`);
    await this.educationService.createAssignment(payload.auth0Id);
  }

  @RabbitSubscribe({
    exchange: 'xp-event-exchange',
    routingKey: 'xp.link_clicked',
    queue: 'education-service-link-clicked-queue',
  })
  async handleLinkClicked(payload: { auth0Id: string }) {
    this.logger.log(`Received xp.link_clicked for user ${payload.auth0Id}`);
    try {
      await this.educationService.createAssignment(payload.auth0Id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(
        `Could not create assignment for ${payload.auth0Id}: ${message}`,
      );
    }
  }

  @Post('questions') // ok if this works we shoulb de good.
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
  @ApiBearerAuth() // maybe user as well in future?
  @ApiOperation({ summary: 'List all assignments (admin)' })
  findAllAssignments() {
    return this.educationService.findAllAssignments();
  }
  // keep in mind what to do with the assignment fo admin pages.
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
  @UseGuards(JwtAuthGuard) //make sure the array length match what we have in the number of quuestions.
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit answers for a pening assignment' })
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
