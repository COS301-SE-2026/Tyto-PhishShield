import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, Repository } from 'typeorm';
import { Import } from './entities/import.entity';
import * as path from 'path';
import { ImportType } from './types/import.types';
import { parse } from 'csv-parse/sync';
import { MappingDto } from '@phishshield/dto';

class MappedEmployee extends MappingDto {};

@Injectable()
export class ImportService {

  constructor(
    @InjectRepository(Import)
    private readonly db: Repository<Import>,
  ) {}
  
  async create(createImportDto: CreateImportDto, file: Express.Multer.File) {
    const extension = path.extname(file.originalname).toLowerCase();
    if(!this.validExtention(extension)) {
      throw new BadRequestException('file extension is not allowed');
    }

    if(!this.validMimeType(file.mimetype)) {
      throw new BadRequestException('mimetype not valid');
    }

    const mapping = this.parseMap(createImportDto.mapping);

    const importType = this.importType(extension);

    switch(importType) {
      case ImportType.CSV: {
        this.CSVmethod(file, mapping);
        break;
      }
    }

    const newImport = this.db.create(
      {
        fileName: file.originalname,
        fileSize: file.size,
        fileType: extension,
        mapping: mapping,
        importType: importType,
        status: false,
      }
    );
    await this.db.save(newImport);
    
    return newImport;
  }

  private CSVmethod(importFile: Express.Multer.File, parsedMap: MappingDto) {
    const records = this.parseCSVFile(importFile, parsedMap);
    
    const headers = Object.keys(records[0] ?? {});

    for (const [systemField, csvField] of Object.entries(parsedMap)) {
      if(csvField && !headers.includes(csvField)) {
        throw new BadRequestException(`CSV column "${csvField}" specified for "${systemField}" does not exist`);
      }
    }
    
    const employees: MappedEmployee[] = records.map((row) => this.mapEmployeeRow(row, parsedMap));

    //TODO: Call employee service to transform the employee data further
    console.log(employees);
  }

  findAll() {
    return this.db.find();
  }

  findOne(id: string) {
    return this.db.findOne({
      where: {
        id: id,
      },
    });
  }

  private parseCSVFile(importFile: Express.Multer.File, mapping: MappingDto) {
    const delimeters = [',', ';', '\t'];
    let records: any;
  
    try {
      for (const delimiter of delimeters) {
        try {
          records = parse(importFile.buffer, {
            columns: true, 
            skipEmptyLines: true,
            trim: true,
            delimiter: delimiter
          });
        } catch {
          records = undefined;
        }
        if (records[0] !== undefined) {
          const headers = Object.keys(records[0] ?? {});
          if (headers.includes(mapping.employeeId)) break;
        }
      }
      if (records[0] === undefined) {
        throw new Error('No valid delimiter found');
      }
    } catch (err) {
      throw new BadRequestException(err, 'unable to parse file, please provide a proper csv file.');
    }

    return records;
  }

  private validExtention(extension: string): boolean {
    const allowedExtentions = [
      '.csv',
    ];
    return allowedExtentions.includes(extension.toLowerCase());
  }

  private validMimeType(mimetype: string): boolean {
    const allowedMimeTypes = [
      'text/csv',
      'application/csv',
      'text/plain',
    ];
    return allowedMimeTypes.includes(mimetype.toLowerCase());
  }

  private importType(extension: string): ImportType {
    switch(extension.toLowerCase()) {
      case '.csv': return ImportType.CSV
      default: return ImportType.API
    }
  }

  private parseMap(mapping: string | undefined): MappingDto {
    if (!mapping) return {
      employeeId: 'employeeId',
    };

    try {

      const parsedMap = JSON.parse(mapping);

      const validMap: MappingDto = {
        employeeId: parsedMap?.employeeId ?? 'employeeId',
        email: parsedMap?.email,
        firstName: parsedMap?.firstName,
        lastName: parsedMap?.lastName,
        department: parsedMap?.department,
        jobTitle: parsedMap?.jobTitle,
        managerEmail: parsedMap?.managerEmail,
        managerId: parsedMap?.managerId,
        employeeStatus: parsedMap?.employeeStatus,
        externalId: parsedMap?.externalId,
      }

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

  private mapEmployeeRow(row: Record<string, string>, mapping: MappingDto): MappedEmployee {
    return {
      employeeId: row[mapping.employeeId],
      email: mapping.email ? row[mapping.email] : undefined,
      firstName: mapping.firstName ? row[mapping.firstName] : undefined,
      lastName: mapping.lastName ? row[mapping.lastName] : undefined,
      department: mapping.department ? row[mapping.department] : undefined,
      jobTitle: mapping.jobTitle ? row[mapping.jobTitle] : undefined,
      managerEmail: mapping.managerEmail ? row[mapping.managerEmail] : undefined,
      managerId: mapping.managerId ? row[mapping.managerId] : undefined,
      employeeStatus: mapping.employeeStatus ? row[mapping.employeeStatus] : undefined,
      externalId: mapping.externalId ? row[mapping.externalId] : undefined,
    };
  }
}
