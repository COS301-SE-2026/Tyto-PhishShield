import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MailingServiceService } from './mailing-service.service';
import { CreateMailingServiceDto } from '../dto/create-mailing-service.dto';
import { UpdateMailingServiceDto } from '../dto/update-mailing-service.dto';

@Controller('mailing-service')
export class MailingServiceController {
  constructor(private readonly mailingServiceService: MailingServiceService) {}

  @Post()
  create(@Body() createMailingServiceDto: CreateMailingServiceDto) {
    return this.mailingServiceService.create(createMailingServiceDto);
  }

  @Get()
  findAll() {
    return this.mailingServiceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mailingServiceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMailingServiceDto: UpdateMailingServiceDto) {
    return this.mailingServiceService.update(+id, updateMailingServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mailingServiceService.remove(+id);
  }
}
