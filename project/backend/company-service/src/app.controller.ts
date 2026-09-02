import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';
import { Employee } from './employee/entities/employee.entity';

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

  @MessagePattern('company.fields')
  fields() {
    return {
      employeeId: 'employeeId',
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      jobTitle: 'jobTitle',
      department: 'department',
      managerId: 'managerId',
      employeeStatus: 'employeeStatus',
      registered: 'registered',
      externalId: 'externalId',
    };
  }
}
