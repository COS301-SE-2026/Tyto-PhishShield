import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EventProducerModule } from '@phishshield/eventhandler';
import { FailedImport } from './entities/failed-import.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, FailedImport]),
    EventProducerModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
