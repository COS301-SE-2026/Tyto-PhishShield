import { PartialType } from '@nestjs/mapped-types';
import { CreateMailingServiceDto } from './create-mailing-service.dto';

export class UpdateMailingServiceDto extends PartialType(CreateMailingServiceDto) {}
