import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ImportService } from './import.service';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // max file size is 5 MB
      },
    }),
  )
  create(@Body() createImportDto: CreateImportDto, @UploadedFile() file: Express.Multer.File) {
    return this.importService.create(createImportDto, file);
  }

  @MessagePattern('imports.get')
  findAll() {
    return this.importService.findAll();
  }

  @MessagePattern('imports.get.one')
  findOne(@Payload() importId: string) {
    if (!importId || importId === '') return this.findAll();
    return this.importService.findOne(importId);
  }
}
