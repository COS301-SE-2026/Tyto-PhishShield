import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Import } from './entities/import.entity';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [TypeOrmModule.forFeature([Import]), EmployeeModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
