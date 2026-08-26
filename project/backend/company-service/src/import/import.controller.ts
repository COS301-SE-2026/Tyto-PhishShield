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

  @MessagePattern('imports.get')
  findAll() {
    return this.importService.findAll();
  }

  @MessagePattern('imports.get')
  findOne(@Payload() importId: string) {
    return this.importService.findOne(importId);
  }
}
