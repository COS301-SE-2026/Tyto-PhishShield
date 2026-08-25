import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImportService } from './import.service';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  create(@Body() createImportDto: CreateImportDto) {
    return this.importService.create(createImportDto);
  }

  @MessagePattern('import.get')
  find(@Payload() importId: string | undefined) {
    return (importId) ? this.importService.findOne(importId) : this.importService.findAll();
  }
}
