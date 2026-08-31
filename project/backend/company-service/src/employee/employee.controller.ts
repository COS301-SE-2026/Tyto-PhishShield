import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { EmployeeDto } from '@phishshield/dto';

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
}
