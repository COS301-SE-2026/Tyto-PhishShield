import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MailingServiceService } from './mailing-service.service';
import { GenerateEmailDto } from './dto/generate-email.dto';

@Controller('mailing-service')
export class MailingServiceController {
  constructor(private readonly mailingServiceService: MailingServiceService) {}

  @Post()
  create(@Body() createMailingServiceDto: GenerateEmailDto) {
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mailingServiceService.remove(+id);
  }
}
