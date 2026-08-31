/**
 * @Class CompanyController
 *
 * @abstract Allows company data to be imported
 *
 * @function {@link ImportService#create} - creates an import entity in the db
 * @function {@link ImportService#findAll}
 * @function {@link ImportService#findOne}
 * @function {@link ImportService#CSVmethod} - starts parsing employee information using a csv file
 * @function {@link ImportService#parseCSVFile} - actually parses the csv file
 * @function {@link ImportService#validExtention} - checks if file extention is valid
 * @function {@link ImportService#validMimeType} - checks if mimetype is valid
 * @function {@link ImportService#importType} - returns the import type being handled
 * @function {@link ImportService#parseMap} - maps the parsed data according to the mapping provided
 * @function {@link ImportService#mapEmployeeRow} - maps employee row data to an employee object
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsOptional, IsString } from 'class-validator';
import { EmployeeDto } from '@phishshield/dto';

class uploadDataDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The binary csv file to upload',
  })
  file: any;

  @ApiProperty({
    type: 'string',
    description:
      'Optional JSON mapping of system fields to CSV column names. If omitted, matching column names will be used automatically.',
    example: JSON.stringify({
      employeeId: 'Employee-Number Field',
      email: 'Work-Email Field',
      firstName: 'First-Name Field',
      lastName: 'Surname Field',
      department: 'Department Field',
      jobTitle: 'Job-Title Field',
      managerEmail: 'Manager-Email Field',
      managerId: 'Manager-ID Field',
      employeeStatus: 'Employment-Status Field',
      externalId: 'HR-Employee-ID Field',
    }),
  })
  @IsOptional()
  @IsString()
  mapping?: string;
}

@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  private readonly companyServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    config: ConfigService,
  ) {
    this.companyServiceUrl = config.get<string>(
      'COMPANY_SERVICE_URL',
      'http://localhost:3009',
    );
  }

  @Post('import')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({
    summary: 'Imports company employee data to the system',
  })
  @ApiBody({ type: uploadDataDto })
  @ApiConsumes('multipart/form-data')
  importEmplyeeData(@Req() req: Request, @Res() res: Response) {
    return this.proxy.beterForward(req, res);
  }

  @Get('imports')
  @Roles('admin')
  @ApiOperation({
    summary: 'Fetches imports data from service',
  })
  @ApiBearerAuth()
  fetchAllImports() {
    return this.proxy.sendTcpMessage(this.proxy.companyClient, 'imports.get');
  }

  @Get('imports/:importId')
  @ApiOperation({
    summary: 'Fetches specific import data from service',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'importId', type: 'string', example: 'IMPORT-001' })
  @Roles('admin')
  fetchImport(@Param('importId') importId: string) {
    return this.proxy.sendTcpMessage(
      this.proxy.companyClient,
      'imports.get.one',
      importId,
    );
  }

  @Get('employees')
  @ApiOperation({
    summary: 'Fetches employees data from service',
  })
  @ApiBearerAuth()
  @Roles('admin')
  fetchAllEmployees() {
    return this.proxy.sendTcpMessage(this.proxy.companyClient, 'employees.get');
  }

  @Get('employees/:employeeId')
  @ApiOperation({
    summary: 'Fetches specific employee data from service',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'employeeId', type: 'string', example: 'u-001' })
  @Roles('admin')
  fetchEmployee(@Param('employeeId') employeeId: string) {
    return this.proxy.sendTcpMessage(
      this.proxy.companyClient,
      'employees.get.one',
      employeeId,
    );
  }

  @Patch('employees/:employeeId')
  @ApiOperation({
    summary: 'updates specific employee data in the service',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'employeeId', type: 'string', example: 'u-001' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employeeId: {
          type: 'string',
          example: 'u-001',
          description: 'employee id',
        },
        email: {
          type: 'string',
          example: 'test@example.com',
          description: 'employee email',
        },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        department: { type: 'string', example: 'IT & Security' },
        jobTitle: { type: 'string', example: 'developer' },
        managerEmail: { type: 'string', example: 'manager@example.com' },
        MangerId: { type: 'string', example: 'u-002' },
        employeeStatus: { type: 'string', example: 'Active' },
        externalId: { type: 'string', example: '0123456' },
      },
    },
  })
  @Roles('admin')
  updateEmplooyee(
    @Param('employeeId') employeeId: string,
    @Body() employeeDto: EmployeeDto,
  ) {
    return this.proxy.sendTcpMessage(
      this.proxy.companyClient,
      'employee.update',
      { employeeId: employeeId, newEmployeeData: employeeDto },
    );
  }

  @Delete('employees/:employeeId')
  @ApiOperation({
    summary: 'Deletes specific employee data from service',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'employeeId', type: 'string', example: 'u-001' })
  @Roles('admin')
  deleteEmployee(@Param('employeeId') employeeId: string) {
    return this.proxy.sendTcpMessage(
      this.proxy.companyClient,
      'employee.delete',
      employeeId,
    );
  }

  @Get('fields')
  @ApiOperation({
    summary: 'Fetches the fields avaliable in the company service database',
  })
  @ApiBearerAuth()
  @Roles('admin')
  fetchFields() {
    return this.proxy.sendTcpMessage(
      this.proxy.companyClient,
      'company.fields',
    );
  }
}
