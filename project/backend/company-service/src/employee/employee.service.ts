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
    if (!await this.isUnique(createEmployeeDto)) return await this.update(createEmployeeDto.employeeId, createEmployeeDto);
    try {
      const validEmployee = this.createValidEmployee(createEmployeeDto);
      const employee = this.db.create(validEmployee);
      return await this.db.save(employee);
    } catch {
      //save in invalid employee table
    }
  }

  async findAll() {
    return await this.db.find();
  }

  async findOne(id: string) {
    return await this.db.findOne({
      where: {
        employeeId: id,
      }
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    try {
      const validEmployee = this.createValidEmployee(updateEmployeeDto);
      await this.db.update(id, validEmployee);
    } catch(err) {
      //save in invalid employee table
      console.log(err);
    }
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    if (!employee) {
      return false;
    }

    await this.updateSubMembers(id);

    const removedEmployee = await this.db.remove(employee);
    if (!removedEmployee) {
      return false;
    }
    return true;
  }

  private async isUnique(employee: CreateEmployeeDto): Promise<boolean> {
    const foundEmployee = await this.findOne(employee.employeeId);
    return foundEmployee ? true : false;
  }

  private async updateSubMembers(id: string) {
    const subMembers = await this.findSubMembers(id);
    const updatedMembers = subMembers.map((member) => ({
      ...member,
      managerId: undefined,
    }));
    for (const member of updatedMembers) {
      this.update(member.employeeId, member);
    }
  }

  private async findSubMembers(id: string): Promise<Employee[]> {
    return await this.db.find({
      where: {
        managerId: id,
      }
    });
  }

  private createValidEmployee(employee: CreateEmployeeDto): CreateEmployeeDto {
    if (employee.employeeId === '') {
      throw Error('empty employee id');
    }
    if (employee.email === '') {
      throw Error('empty email id');
    }
    return employee;
  }

  async addEmployees(employees: CreateEmployeeDto[]) {
    const mappedEmployees = this.mapEmployeesManagers(employees);
    console.log(mappedEmployees);
    for(const employee of mappedEmployees) {
      console.log(await this.create(employee));
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
