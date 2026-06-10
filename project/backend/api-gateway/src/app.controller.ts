/**
 * AppController — Root controller for the API Gateway.
 *
 * {@link checkHealth} Provides a simple health/greeting endpoint used for smoke checks.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthServices } from './dto/health-check.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary:
      'returns all the services in which the tcp transport connections are open',
  })
  @ApiResponse({
    type: HealthServices,
  })
  checkHealth() {
    return this.appService.checkMicroServicesHealth();
  }
}
