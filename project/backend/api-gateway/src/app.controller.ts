/**
 * AppController — Root controller for the API Gateway.
 *
 * {@link checkHealth} Provides a simple health/greeting endpoint used for smoke checks.
 */
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Health } from './dto/health-check.dto';
import { Public } from './auth/public.decorator';
import { ContactSalesDto } from './dto/contact-sales.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  @ApiOperation({
    summary:
      'returns all the services in which the tcp transport connections are open',
  })
  @ApiResponse({
    type: Health
  })
  async checkHealth(): Promise<Health> {
    return {api_version: process.env.VERSION, environment: process.env.ENVIRONMENT, services: await this.appService.checkMicroServicesHealth()};
  }

  @Public()
  @Post('company/contact-sales')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send PhishShield info to a prospective company' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['companyName', 'workEmail'],
      properties: {
        companyName: { type: 'string', example: 'Acme Corp' },
        workEmail: { type: 'string', example: 'you@acme.com' },
        message: { type: 'string', example: 'We have 200 employees...' },
      },
    },
  })
  contactSales(@Body() body: ContactSalesDto) {
    return this.appService.contactSales(body);
  }
}
