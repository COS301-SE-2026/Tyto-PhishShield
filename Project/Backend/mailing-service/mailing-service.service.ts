import { Injectable } from '@nestjs/common';
import { CreateMailingServiceDto } from './dto/create-mailing-service.dto';
import { UpdateMailingServiceDto } from './dto/update-mailing-service.dto';

@Injectable()
export class MailingServiceService {
  create(createMailingServiceDto: CreateMailingServiceDto) {
    return 'This action adds a new mailingService';
  }

  findAll() {
    return `This action returns all mailingService`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mailingService`;
  }

  update(id: number, updateMailingServiceDto: UpdateMailingServiceDto) {
    return `This action updates a #${id} mailingService`;
  }

  remove(id: number) {
    return `This action removes a #${id} mailingService`;
  }
}
