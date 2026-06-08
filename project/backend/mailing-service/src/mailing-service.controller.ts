/*
 * Used to check health of tcp connection from the api-gateway
 */

import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MailingServiceController {
  constructor() {}

  @MessagePattern('health.check')
  health(): string {
    return 'ok';
  }
}
