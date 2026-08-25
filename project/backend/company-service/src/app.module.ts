import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImportModule } from './import/import.module';
import { EmployeeModule } from './employee/employee.module';

@Module({
  imports: [ImportModule, EmployeeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
