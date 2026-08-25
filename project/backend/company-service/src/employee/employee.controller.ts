import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @MessagePattern('employees.get')
  findAll(@Payload() employeeId: string | undefined) {
    return (employeeId) ? this.employeeService.findOne(employeeId) : this.employeeService.findAll();
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
