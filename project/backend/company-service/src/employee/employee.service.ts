/**
 * @Class EmployeeService
 *
 * @abstract Handles Employee information stored in the database
 *
 * @function {@link EmployeeService#create} - creates an employee entity in the db
 * @function {@link EmployeeService#findAll}
 * @function {@link EmployeeService#findOne}
 * @function {@link EmployeeService#update} - updates an employee entity in the db
 * @function {@link EmployeeService#remove} - removes an employee entity in the db
 * @function {@link EmployeeService#isUnique} - checks if an employee entity already exists or not
 * @function {@link EmployeeService#updateSubMembers} - nullifies the managerId field of all the employees under a manager
 * @function {@link EmployeeService#findSubMembers} - finds all employees under a manger
 * @function {@link EmployeeService#createValidEmployee} - validates an employee
 * @function {@link EmployeeService#addEmployees} - adds a list of employees to the db
 * @function {@link EmployeeService#mapEmployeesManagers} - ensures employee manager links uses the employeeId field
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { EmployeeDto, EventEmployee } from '@phishshield/dto';
import {
  EVENT_EXCHANGE,
  EventProducerService,
} from '@phishshield/eventhandler';
import { FailedImport } from './entities/failed-import.entity';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);
  constructor(
    @InjectRepository(Employee)
    private readonly db: Repository<Employee>,
    @InjectRepository(FailedImport)
    private readonly invalidDb: Repository<FailedImport>,
    @Inject() private readonly event: EventProducerService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    if (!(await this.isUnique(createEmployeeDto)))
      return await this.update(createEmployeeDto.employeeId, createEmployeeDto);
    try {
      const validEmployee = this.createValidEmployee(createEmployeeDto);
      const employee = this.db.create(validEmployee);
      return await this.db.save(employee);
    } catch (err) {
      const error = err as Error;
      return await this.saveError(createEmployeeDto, error);
    }
  }

  async findAll() {
    return await this.db.find();
  }

  async findOne(id: string) {
    return await this.db.findOne({
      where: {
        employeeId: id,
      },
    });
  }

  async update(id: string, updateEmployeeDto: EmployeeDto) {
    try {
      const validEmployee = this.createValidEmployee(updateEmployeeDto);
      const existingEmployee = await this.findOne(id);
      if (!existingEmployee) {
        throw new Error('Employee not found');
      }
      existingEmployee.email = validEmployee.email;
      existingEmployee.firstName = validEmployee.firstName;
      existingEmployee.lastName = validEmployee.lastName;
      existingEmployee.department = validEmployee.department;
      existingEmployee.jobTitle = validEmployee.jobTitle;
      existingEmployee.managerId = validEmployee.managerId;
      existingEmployee.employeeStatus = validEmployee.employeeStatus;
      existingEmployee.externalId = validEmployee.externalId;
      existingEmployee.registered = validEmployee.registered ?? false;
      existingEmployee.title = validEmployee.title;
      existingEmployee.auth0Id = validEmployee.auth0Id;

      if (existingEmployee.auth0Id) {
        this.sendEmployeeInfo(existingEmployee);
      }

      return await this.db.save(existingEmployee);
    } catch (err) {
      const error = err as Error;
      return await this.saveError(updateEmployeeDto, error);
    }
  }

  async saveError(data: any, error: Error) {
    return await this.invalidDb.save({
      data: JSON.stringify(data),
      errorMessage: error.message,
    });
  }

  async getErrors() {
    return await this.invalidDb.find();
  }

  async deleteError(id: string) {
    const error = await this.invalidDb.find({
      where: {
        id: id,
      },
    });
    if (!error) {
      return false;
    }
    await this.invalidDb.remove(error);
    return true;
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
    return !foundEmployee;
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
      },
    });
  }

  private createValidEmployee(
    employee: CreateEmployeeDto | EmployeeDto,
  ): CreateEmployeeDto | Employee {
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
    for (const employee of mappedEmployees) {
      await this.create(employee);
    }
  }

  private mapEmployeesManagers(
    employees: CreateEmployeeDto[],
  ): CreateEmployeeDto[] {
    if (employees.length === 0) {
      return employees;
    }

    return employees.map((employee) => {
      let manager: CreateEmployeeDto | undefined;
      if (employee.managerId) {
        manager = employees.find(
          (potentialManager) =>
            potentialManager.employeeId === employee.managerId ||
            potentialManager.externalId === employee.managerId,
        );
      } else if (employee.managerEmail) {
        manager = employees.find(
          (potentialManager) =>
            potentialManager.email === employee.managerEmail,
        );
      }

      return {
        ...employee,
        managerId: manager?.employeeId,
      };
    });
  }

  async upsertUser(user: {
    auth0Id: string;
    email?: string;
    department?: string;
  }) {
    try {
      const existing = await this.db.findOne({
        where: { auth0Id: user.auth0Id },
      });
      if (existing) {
        Object.assign(existing, user);
        return await this.db.save(existing);
      }
      const newUser = this.db.create(user);
      return await this.db.save(newUser);
    } catch (err: unknown) {
      if (err instanceof QueryFailedError) {
        const driverError = err.driverError as { code?: string } | undefined;
        if (driverError?.code === '23505') {
          this.logger.warn(
            `Duplicate user event for ${user.auth0Id}, ignoring`,
          );
          return;
        }
      }
      throw err;
    }
  }

  async deleteUser(auth0Id: string) {
    await this.db.delete({ auth0Id });
  }

  async sendEmployeeInfo(employee: EmployeeDto) {
    let managerAuth0Id: string | undefined;
    if (employee.managerId) {
      const manager = await this.findOne(employee.managerId);
      managerAuth0Id = manager?.auth0Id;
    }
    if (managerAuth0Id === null || managerAuth0Id === undefined) {
      managerAuth0Id = '';
    }
    const body: EventEmployee = {
      auth0Id: employee.auth0Id || '',
      managerId: managerAuth0Id,
      jobTitle: employee.jobTitle,
      title: employee.title,
    };
    this.event.publishEvent(
      EVENT_EXCHANGE.company,
      'company.employeeInfo',
      body,
    );
  }
}
