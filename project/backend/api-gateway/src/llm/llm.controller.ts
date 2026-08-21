import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

function authHeader(req: Request): Record<string, string> {
  const token = req.headers['authorization'] as string | undefined;
  return token ? { authorization: token } : {};
}

@ApiTags('LLM')
@Controller('llm')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LlmController {
  private readonly llmServiceUrl: string;
  private readonly llmProvider: string;

  constructor(
    private readonly proxyService: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.llmServiceUrl = this.config.get<string>(
      'LLM_SERVICE_URL',
      'http://localhost:3008',
    );
    this.llmProvider = this.config.get<string>(
      'LLM_PROVIDER',
      'google-ai-studio/gemini-3.1-flash-lite',
    );
  }

  //Note this is just a basic enpoint
  @Post('generate-email')
  @Roles('admin')
  @ApiOperation({ summary: 'generate an email body with a certain topic' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['topic'],
      properties: {
        topic: {
          type: 'string',
          example: 'warning about phishing emails',
        },
      },
    },
  })
  generateEmail(@Req() req: Request, @Body() body: { topic: string }) {
    const augmentedBody = {
      model: this.llmProvider,
      messages: [
        {
          role: 'user',
          content: `
          Generate a convincing email html body with just the <div> body part (without the subject) based on the topic below where any variables listed below are just printed as \${variable name}. 
          Variables: 
            Reciever's name
            Sender's name
          Topic:
            ${body.topic}
          Also do not include \\n characters. Do use some inline css styling. For any element class names use single quotes (').
        `,
        },
      ],
    };
    return this.proxyService.forward({
      method: 'POST',
      url: `${this.llmServiceUrl}/api/llm-gateway/chat`,
      headers: authHeader(req),
      data: augmentedBody,
    });
  }
}
