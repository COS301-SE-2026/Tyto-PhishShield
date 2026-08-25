import { Injectable } from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';

@Injectable()
export class ImportService {
  create(createImportDto: CreateImportDto) {
    return 'This action adds a new import';
  }

  findAll() {
    return `This action returns all import`;
  }

  findOne(id: string) {
    return `This action returns a #${id} import`;
  }
}
