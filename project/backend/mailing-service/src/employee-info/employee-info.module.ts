import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';
import { EmployeeInfoService } from './employee-info.service';
import { EmployeeInfoController } from './employee-info.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeInfoEntity])],
  controllers: [EmployeeInfoController],
  providers: [EmployeeInfoService],
  exports: [EmployeeInfoService],
})
export class EmployeeInfoModule {}
