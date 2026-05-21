/**
 * AppController — health/root controller for the Accounts service.
 *
 * - Provides a simple endpoint for smoke tests and basic service info.
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
