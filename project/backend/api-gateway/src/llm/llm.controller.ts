import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DifficultyLlmGenerationDto } from './dto/difficulty-llm-generation.dto';

@ApiTags('LLM')
@Controller('llm')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LlmController {
  private readonly llmServiceUrl: string;

  constructor(
    private readonly proxyService: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.llmServiceUrl = this.config.get<string>(
      'LLM_SERVICE_URL',
      'http://localhost:3008',
    );
  }

  @Post('difficulty_generation')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Generate phishing-simulation email templates for a given difficulty, tone, and message type',
  })
  @ApiBody({ type: DifficultyLlmGenerationDto })
  difficultyGeneration(@Body() body: DifficultyLlmGenerationDto) {
    return this.proxyService.forward({
      method: 'POST',
      url: `${this.llmServiceUrl}/api/llm/difficulty_generation`,
      data: body,
    });
  }
}
