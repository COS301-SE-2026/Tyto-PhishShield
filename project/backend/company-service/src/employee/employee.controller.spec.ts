import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { JsonSocket } from '@nestjs/microservices';

describe('EmployeeController', () => {
  let controller: EmployeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [{
        provide: EmployeeService,
        useValue: {
          update: jest.fn(),
          remove: jest.fn(),
          findOne: jest.fn(),
          findAll: jest.fn(),
        }
      }],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
