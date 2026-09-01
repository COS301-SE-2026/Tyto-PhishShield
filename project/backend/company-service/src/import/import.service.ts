/**
 * @Class ImportService
 *
 * @abstract Allows data to be imported and parsed for the employee service
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

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Import } from './entities/import.entity';
import * as path from 'path';
import { ImportType } from './types/import.types';
import { parse } from 'csv-parse/sync';
import { MappingDto } from '@phishshield/dto';
import { CreateEmployeeDto } from '../employee/dto/create-employee.dto';
import { EmployeeService } from '../employee/employee.service';
import { isUUID } from 'class-validator';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Import)
    private readonly db: Repository<Import>,
    private readonly employeeService: EmployeeService,
  ) {}

  async create(createImportDto: CreateImportDto, file: Express.Multer.File) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!this.validExtention(extension)) {
      throw new BadRequestException('file extension is not allowed');
    }

    if (!this.validMimeType(file.mimetype)) {
      throw new BadRequestException('mimetype not valid');
    }

    const mapping = this.parseMap(createImportDto.mapping);

    const importType = this.importType(extension);
    let employees: CreateEmployeeDto[];
    switch (importType) {
      case ImportType.CSV: {
        employees = this.CSVmethod(file, mapping);
        break;
      }
      default:
        throw new BadRequestException('Invalid import type');
    }

    const newImport = this.db.create({
      fileName: file.originalname,
      fileSize: file.size,
      fileType: extension,
      mapping: mapping,
      importType: importType,
      status: false,
    });
    await this.db.save(newImport);

    const importEmployees = employees.map((employee) => {
      return { ...employee, import: newImport };
    });
    this.employeeService.addEmployees(importEmployees);

    return newImport;
  }

  private CSVmethod(
    importFile: Express.Multer.File,
    parsedMap: MappingDto,
  ): CreateEmployeeDto[] {
    const records = this.parseCSVFile(importFile, parsedMap);

    const headers = Object.keys(records[0] ?? {});

    for (const [systemField, csvField] of Object.entries(parsedMap)) {
      if (csvField && !headers.includes(csvField)) {
        throw new BadRequestException(
          `CSV column "${csvField}" specified for "${systemField}" does not exist`,
        );
      }
    }

    const employees: CreateEmployeeDto[] = records.map((row) =>
      this.mapEmployeeRow(row, parsedMap),
    );

    return employees;
  }

  async findAll() {
    return await this.db.find();
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid employee ID');
    }
    return await this.db.findOne({
      where: {
        id: id,
      },
    });
  }

  private parseCSVFile(importFile: Express.Multer.File, mapping: MappingDto) {
    const delimeters = [',', ';', '\t'];
    let records: Record<string, string>[] | undefined;

    try {
      for (const delimiter of delimeters) {
        try {
          records = parse(importFile.buffer, {
            columns: true,
            skipEmptyLines: true,
            trim: true,
            delimiter: delimiter,
          });
        } catch {
          records = undefined;
        }
        if (records && records[0] !== undefined) {
          const headers = Object.keys(records[0] ?? {});
          if (headers.includes(mapping.employeeId)) break;
        }
      }
      if (!records || records[0] === undefined) {
        throw new Error('No valid delimiter found');
      }
    } catch (err) {
      throw new BadRequestException(
        err,
        'unable to parse file, please provide a proper csv file.',
      );
    }

    return records;
  }

  private validExtention(extension: string): boolean {
    const allowedExtentions = ['.csv'];
    return allowedExtentions.includes(extension.toLowerCase());
  }

  private validMimeType(mimetype: string): boolean {
    const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
    return allowedMimeTypes.includes(mimetype.toLowerCase());
  }

  private importType(extension: string): ImportType {
    switch (extension.toLowerCase()) {
      case '.csv':
        return ImportType.CSV;
      default:
        return ImportType.API;
    }
  }

  private parseMap(mapping: string | undefined): MappingDto {
    if (!mapping)
      return {
        employeeId: 'employeeId',
        email: 'email',
      };

    try {
      const parsedMap = JSON.parse(mapping) as MappingDto;

      const validMap: MappingDto = {
        employeeId: parsedMap?.employeeId ?? 'employeeId',
        email: parsedMap?.email ?? 'email',
        firstName: parsedMap?.firstName,
        lastName: parsedMap?.lastName,
        department: parsedMap?.department,
        jobTitle: parsedMap?.jobTitle,
        managerEmail: parsedMap?.managerEmail,
        managerId: parsedMap?.managerId,
        employeeStatus: parsedMap?.employeeStatus,
        externalId: parsedMap?.externalId,
      };

      return validMap;
    } catch {
      throw new BadRequestException('Mapping field contains invalid JSON');
    }
  }

  // private validateRequiredFields(headers: string[]) {
  //   if(!headers.includes(Object.keys(MappingDto)[0])) {
  //     throw new BadRequestException
  //   }
  // }

  private mapEmployeeRow(
    row: Record<string, string>,
    mapping: MappingDto,
  ): CreateEmployeeDto {
    return {
      employeeId: row[mapping.employeeId],
      email: row[mapping.email],
      firstName: mapping.firstName ? row[mapping.firstName] : undefined,
      lastName: mapping.lastName ? row[mapping.lastName] : undefined,
      department: mapping.department ? row[mapping.department] : undefined,
      jobTitle: mapping.jobTitle ? row[mapping.jobTitle] : undefined,
      managerEmail: mapping.managerEmail
        ? row[mapping.managerEmail]
        : undefined,
      managerId: mapping.managerId ? row[mapping.managerId] : undefined,
      employeeStatus: mapping.employeeStatus
        ? row[mapping.employeeStatus]
        : undefined,
      externalId: mapping.externalId ? row[mapping.externalId] : undefined,
    };
  }
}
