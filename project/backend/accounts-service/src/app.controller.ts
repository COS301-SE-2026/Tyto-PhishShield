/**
 * AppController — health/root controller for the Accounts service.
 *
 * - Provides a simple endpoint for smoke tests and basic service info.
 * 
 * - {@link health} Used to check tcp health connection from api-gateway
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('health.check')
  health(): string {
    return 'ok';
  }
}
