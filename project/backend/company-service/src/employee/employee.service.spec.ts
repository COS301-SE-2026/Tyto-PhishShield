import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeController } from './employee.controller';
import { CreateEmployeeDto } from './dto/create-employee.dto';

describe('EmployeeService', () => {
  let service: EmployeeService;
  const repo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        controllers: [EmployeeController],
        providers: [
          EmployeeService,
          { provide: getRepositoryToken(Employee), useValue: repo },
        ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Validate employee', () => {
    it('Returns employee', () => {
      const employee: CreateEmployeeDto = {
        employeeId: '1',
        email: 'test@email.com',
      }

      const returned = service['createValidEmployee'](employee);
      expect(returned).toBe(employee);
    })
  });
});
