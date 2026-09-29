import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DifficultyLlmGenerationDto } from './dto/difficulty-llm-generation.dto';
import { GenerateSpearPhishingDto } from './dto/generate-spear-phishing.dto';
import { LlmService } from './llm.service';

@ApiTags('LLM')
@Controller('llm')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LlmController {
  private readonly llmServiceUrl: string;

  constructor(
    private readonly proxyService: ProxyService,
    private readonly config: ConfigService,
    private readonly llmService: LlmService,
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

  @Post('spear_phishing')
  @Roles('admin')
  @ApiOperation({
    summary: 'Generate a spear phishing email based on the provided context',
  })
  @ApiBody({
    type: GenerateSpearPhishingDto,
    examples: {
      default: {
        value: {
          recipientAuth0Id: 'auth0|1',
          senderAuth0Id: 'auth0|2',
          recipientDepartment: 'it_&_security',
          senderDepartment: 'it_&_security',
          messageType: 'document_request',
          extraContext: '',
          scheduledFrom: '2026-05-25T14:30:00.000Z',
          scheduledTo: '2026-05-25T14:30:00.000Z',
          isManager: true,
          frequentContact: true,
        },
      },
    },
  })
  async spearPhishing(@Body() body: GenerateSpearPhishingDto) {
    const strugglesCategory = await this.llmService.resolveStruggleCategory(
      body.recipientAuth0Id,
    );

    return this.proxyService.forward({
      method: 'POST',
      url: `${this.llmServiceUrl}/api/llm/spear_phishing`,
      data: { ...body, strugglesCategory },
    });
  }
}
