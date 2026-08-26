import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @MessagePattern('employees.get')
  findAll() {
    return this.employeeService.findAll();
  }

  @MessagePattern('employees.get')
  findOne(@Payload() employeeId: string) {
    return this.employeeService.findOne(employeeId)
  }

  @MessagePattern('employee.update')
  update(@Payload() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(updateEmployeeDto.id, updateEmployeeDto);
  }

  @MessagePattern('employee.delete')
  remove(@Payload() emplyeeId: string) {
    return this.employeeService.remove(emplyeeId);
  }
}
