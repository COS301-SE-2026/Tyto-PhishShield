import { PartialType } from '@nestjs/mapped-types';
import { CreateImportDto } from './create-import.dto';

export class UpdateImportDto extends PartialType(CreateImportDto) {}
