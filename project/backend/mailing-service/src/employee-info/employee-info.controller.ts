import { Controller, Logger } from '@nestjs/common';
import {
  RabbitSubscribe,
  MessageHandlerErrorBehavior,
} from '@golevelup/nestjs-rabbitmq';
import { EventEmployee } from '@phishshield/dto';
import {
  EmployeeInfoService,
  InvalidEmployeeEventError,
} from './employee-info.service';

@Controller()
export class EmployeeInfoController {
  private readonly logger = new Logger(EmployeeInfoController.name);

  constructor(private readonly employeeInfoService: EmployeeInfoService) {}

  @RabbitSubscribe({
    exchange: 'company-event-exchange',
    routingKey: 'company.employeeInfo',
    queue: 'mailing.company.employeeInfo.queue',
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  async onEmployeeInfo(payload: EventEmployee) {
    try {
      await this.employeeInfoService.upsert(payload);
    } catch (err) {
      if (err instanceof InvalidEmployeeEventError) {
        this.logger.warn(
          `Discarding invalid employeeInfo event: ${err.message}`,
          JSON.stringify(payload),
        );
        return;
      }
      throw err;
    }
  }
}
