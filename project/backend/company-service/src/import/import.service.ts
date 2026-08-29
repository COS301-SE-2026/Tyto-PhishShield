import { Injectable } from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Import } from './entities/import.entity';

@Injectable()
export class ImportService {

  constructor(
    @InjectRepository(Import)
    private readonly db: Repository<Import>,
  ) {}
  
  async create(createImportDto: CreateImportDto) {
    const newImport = this.db.create(
      createImportDto
    );
    await this.db.save(newImport);
    this.parseCSVFile(createImportDto.file);
    return newImport;
  }

  private async parseCSVFile(importFile: File) {

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
}
