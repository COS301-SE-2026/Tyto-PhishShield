import { Injectable } from '@nestjs/common';
import { GenerateEmailDto } from './dto/generate-email.dto';

@Injectable()
export class MailingServiceService {
  create(createMailingServiceDto: GenerateEmailDto) {
    return 'This action adds a new mailingService';
  }

  findAll() {
    return `This action returns all mailingService`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mailingService`;
  }

  remove(id: number) {
    return `This action removes a #${id} mailingService`;
  }
}
