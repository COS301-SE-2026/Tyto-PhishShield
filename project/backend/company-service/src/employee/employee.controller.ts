import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { EmployeeDto, EventUser } from '@phishshield/dto';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @MessagePattern('employees.get')
  findAll() {
    return this.employeeService.findAll();
  }

  @MessagePattern('employees.get.one')
  findOne(@Payload() employeeId: string) {
    return this.employeeService.findOne(employeeId);
  }

  @MessagePattern('employee.update')
  update(
    @Payload()
    updateEmployeeDto: {
      employeeId: string;
      newEmployeeData: EmployeeDto;
    },
  ) {
    return this.employeeService.update(
      updateEmployeeDto.employeeId,
      updateEmployeeDto.newEmployeeData,
    );
  }

  @MessagePattern('employee.delete')
  remove(@Payload() emplyeeId: string) {
    return this.employeeService.remove(emplyeeId);
  }

   @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.created',
    queue: 'company.queue',
  })
  async onUserCreated(payload: EventUser) {
    await this.employeeService.upsertUser({
      auth0Id: payload.auth0Id,
      email: payload.email,
      department: payload.department,
    });
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.updated',
    queue: 'company.queue',
  })
  async onUserUpdated(payload: EventUser) {
    await this.employeeService.upsertUser({
      auth0Id: payload.auth0Id,
      email: payload.email,
      department: payload.department,
    });
  }

  @RabbitSubscribe({
    exchange: 'accounts-event-exchange',
    routingKey: 'user.deleted',
    queue: 'company.queue',
  })
  async onUserDeleted(payload: EventUser) {
    await this.employeeService.deleteUser(payload.auth0Id);
  }
}
