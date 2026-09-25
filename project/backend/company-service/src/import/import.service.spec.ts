import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Import } from './entities/import.entity';
import { ImportController } from './import.controller';
import { EmployeeService } from '../employee/employee.service';

describe('ImportService', () => {
  let service: ImportService;
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
      controllers: [ImportController],
      providers: [ImportService,
        { provide: EmployeeService, useValue: {addEmployees: jest.fn()}},
        { provide: getRepositoryToken(Import), useValue: repo },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validation tests', () => {
    it('valid extension returns true', () => {
      expect(service['validExtention']('.csv')).toBe(true);
    });
  })
});
