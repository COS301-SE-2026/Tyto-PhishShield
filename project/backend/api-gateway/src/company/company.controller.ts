import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiSchema } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';

class uploadDataDto { 
  @ApiProperty({
      type: 'string',
      format: 'binary',
      description: 'The binary file to upload',
  })
  file: any;

  @ApiProperty({
      type: 'object',
      
      required: ['employeeId', 'email'],
      properties: {
        emplyeeId: {type: 'string', example: 'file-employee-id-field-name', description: 'Field in your csv file for employee ids'},
        email: { type: 'string', example: 'file-email-field-name', description: 'Field in your csv file for emails' },
        firstName: { type: 'string', example: 'first-name-field' },
        lastName: { type: 'string', example: 'last-name-field' },
        department: { type: 'string', example: 'department-field' },
        jobTitle: { type: 'string', example: 'job-title-field' },
        managerEmail: { type: 'string', example: 'manager-email-field' },
        MangerId: { type: 'string', example: 'manager-id-field' },
        employeeStatus: { type: 'string', example: 'employee-status-field' },
        externalId: { type: 'string', example: 'HR-system-id-field' },
      },
  })
  mapping: any;
}

@Controller('company')
@UseGuards(JwtAuthGuard)
@Roles('admin')
export class CompanyController {
    private readonly companyServiceUrl: string;

    constructor(private readonly proxy: ProxyService, config: ConfigService) {
        this.companyServiceUrl = config.get<string>(
            'COMPANY_SERVICE_URL',
            'http://localhost:3009',
        );
    }

    @Post('import')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Imports company employee data to the system',
    })
    @ApiBody({ type: uploadDataDto })
    importEmplyeeData(@Req() req: Request, @Res() res: Response) {
      return this.proxy.beterForward(req, res);
    }

    @Get('imports')
    @ApiOperation({
      summary: 'Fetches imports data from service'
    })
    @ApiBearerAuth()
    fetchAllImports() {
      return this.proxy.sendTcpMessage(this.proxy.companyClient, 'imports.get');
    }

    @Get('imports/:importId')
    @ApiOperation({
      summary: 'Fetches specific import data from service'
    })
    @ApiBearerAuth()
    @ApiParam({ name: 'importId', type: 'string', example: 'IMPORT-001' })
    fetchImport(@Param('importId') importId: string) {
      return this.proxy.sendTcpMessage(this.proxy.companyClient, 'imports.get', importId);
    }

    @Get('employees')
    @ApiOperation({
      summary: 'Fetches employees data from service'
    })
    @ApiBearerAuth()
    fetchAllEmployees() {
      return this.proxy.sendTcpMessage(this.proxy.companyClient, 'employees.get');
    }

    @Get('employees/:employeeId')
    @ApiOperation({
      summary: 'Fetches specific employee data from service'
    })
    @ApiBearerAuth()
    @ApiParam({ name: 'employeeId', type: 'string', example: 'u-001' })
    fetchEmployee(@Param('employeeId') employeeId: string,) {
      return this.proxy.sendTcpMessage(this.proxy.companyClient, 'employees.get', employeeId);
    }

    @Patch('employees/:employeeId')
    @ApiOperation({
      summary: 'updates specific employee data in the service'
    })
    @ApiBearerAuth()
    @ApiParam({ name: 'employeeId', type: 'string', example: 'u-001' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          emplyeeId: {type: 'string', example: 'u-001', description: 'employee id'},
          email: { type: 'string', example: 'test@example.com', description: 'employee email' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          department: { type: 'string', example: 'IT & Security' },
          jobTitle: { type: 'string', example: 'developer' },
          managerEmail: { type: 'string', example: 'manager@example.com' },
          MangerId: { type: 'string', example: 'u-002'},
          employeeStatus: { type: 'string', example: 'Active' },
          externalId: { type: 'string', example: '0123456' },
        }
      }
    })
    updateEmplooyee(@Param('employeeId') employeeId: string, @Body() employeeDto: any) {
      return this.proxy.sendTcpMessage(this.proxy.companyClient, 'employees.update', {employeeId: employeeId, newEmployeeData: employeeDto});
    }

    @Delete('employees/:employeeId')
    @ApiOperation({
      summary: 'Deletes specific employee data from service'
    })
    @ApiBearerAuth()
    @ApiParam({ name: 'employeeId', type: 'string', example: 'u-001' })
    deleteEmployee(@Param('employeeId') employeeId: string,) {
      return this.proxy.sendTcpMessage(this.proxy.companyClient, 'employees.delete', employeeId);
    }

    @Get('fields')
    @ApiOperation({
      summary: 'Fetches the fields avaliable in the company service database'
    })
    @ApiBearerAuth()
    fetchFields() {
      return this.proxy.sendTcpMessage(this.proxy.companyClient, 'company.fields');
    }
}
