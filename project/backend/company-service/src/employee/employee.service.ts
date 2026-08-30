import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmployeeService {

  constructor(
    @InjectRepository(Employee)
    private readonly db: Repository<Employee>
  )
  {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    try {
      const validEmployee = this.createValidEmployee(createEmployeeDto);
      const employee = this.db.create(validEmployee);
      console.log('Added employee:' + employee)
      await this.db.save(employee);
      return employee;
    } catch {
      //save in invalid employee table
    }
  }

  findAll() {
    return this.db.find();
  }

  async findOne(id: string) {
    return await this.db.findOne({
      where: {
        employeeId: id,
      }
    });
  }

  update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    return `This action updates a #${id} employee`;
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    if (!employee) {
      return false;
    }
    const removedEmployee = await this.db.remove(employee);
    if (!removedEmployee) {
      return false;
    }
    return true;
  }

  private createValidEmployee(employee: CreateEmployeeDto): CreateEmployeeDto {
    if (employee.employeeId === '') {
      throw Error('empty employee id');
    }
    if (employee.email === '') {
      throw Error('empoty email id');
    }
    return employee;
  }

  addEmployees(employees: CreateEmployeeDto[]) {
    const mappedEmployees = this.mapEmployeesManagers(employees);
    for(const employee of mappedEmployees) {
      this.create(employee);
    }
  }

  private mapEmployeesManagers(employees: CreateEmployeeDto[]): CreateEmployeeDto[] {
    if (employees.length === 0) {
      return employees;
    }

    return employees.map((employee) => {
      let manager: CreateEmployeeDto | undefined;
      if (employee.managerId) {
        manager = employees.find((potentialManager) => 
          potentialManager.employeeId === employee.managerId ||
          potentialManager.externalId === employee.managerId
        );      
      } else if (employee.managerEmail) {
        manager = employees.find((potentialManager) => potentialManager.email === employee.managerEmail);
      }

      return {
        ...employee,
        managerId: manager?.employeeId,
      }
    });
  }

}
