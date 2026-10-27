import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProxyService } from '../../proxy/proxy.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Department } from '@phishshield/dto';

@ApiTags('Senders')
@Controller('senders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SenderResolverController {
  private readonly mailingServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.mailingServiceUrl = this.config.get<string>(
      'MAILING_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  @Get('recommendations/:recipientAuth0Id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary:
      'Get recommended senders for a recipient, each with a recommendation level and the reasons behind it',
  })
  @ApiParam({
    name: 'recipientAuth0Id',
    type: 'string',
    example: 'auth0|1',
    description: 'The user who will RECEIVE the email',
  })
  @ApiQuery({ name: 'department', required: false, enum: Department })
  getRecommendations(
    @Param('recipientAuth0Id') recipientAuth0Id: string,
    @Query('department') department?: Department,
  ) {
    let url = `${this.mailingServiceUrl}/sender-resolver/recommendations/${encodeURIComponent(recipientAuth0Id)}`;
    if (department) {
      url = `${url}?department=${encodeURIComponent(department)}`;
    }

    return this.proxy.forward({ url, method: 'GET' });
  }
}
