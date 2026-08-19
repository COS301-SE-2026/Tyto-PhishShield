import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, GatewayRole } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

function authHeader(req: Request): Record<string, string> {
  const token = req.headers['authorization'];
  return token ? { Authorization: token } : {};
}

@ApiTags('Education')
@Controller('education')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EducationController {
  private readonly educationServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.educationServiceUrl = this.config.get<string>(
      'EDUCATION_SERVICE_URL',
      'http://localhost:3006',
    );
  }

  @Post('questions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Add a question (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['questionText', 'options', 'correctOptionIndex'],
      properties: {
        questionText: {
          type: 'string',
          example: 'What is a common sign of a phishing email?',
        },
        options: {
          type: 'array',
          items: { type: 'string' },
          example: ['Option A', 'Option B', 'Option C', 'Option D'],
        },
        correctOptionIndex: { type: 'number', example: 1 },
      },
    },
  })
  createQuestion(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.educationServiceUrl}/api/education/questions`,
      method: 'POST',
      data: body,
      headers: authHeader(req),
    });
  }

  @Get('questions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'List all questions (admin)' })
  findAllQuestions(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.educationServiceUrl}/api/education/questions`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Post('assignments')
  @ApiOperation({
    summary: 'Create an education assignment for the current user',
  })
  createAssignment(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.educationServiceUrl}/api/education/assignments`,
      method: 'POST',
      headers: authHeader(req),
    });
  }

  @Get('assignment/mine')
  @ApiOperation({ summary: 'Get current pending assignment with questions' })
  getMyAssignment(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.educationServiceUrl}/api/education/assignment/mine`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('history/mine')
  @ApiOperation({ summary: 'Get current user assignment history' })
  getMyHistory(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.educationServiceUrl}/api/education/history/mine`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Post('answers')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit answers for a pending assignment' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assignmentId', 'answers'],
      properties: {
        assignmentId: { type: 'string', example: 'uuid-here' },
        answers: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 1],
        },
      },
    },
  })
  submitAnswers(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.educationServiceUrl}/api/education/answers`,
      method: 'POST',
      data: body,
      headers: authHeader(req),
    });
  }
}
