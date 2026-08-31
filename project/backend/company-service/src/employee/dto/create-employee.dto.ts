import { MappingDto } from '@phishshield/dto';
import { Import } from '../../import/entities/import.entity';

export class CreateEmployeeDto extends MappingDto {
  import?: Import;
}
