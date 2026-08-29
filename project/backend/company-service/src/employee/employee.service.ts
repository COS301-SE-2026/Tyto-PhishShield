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
    const employee = this.db.create(createEmployeeDto);
    await this.db.save(employee);
    return employee;
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
}
