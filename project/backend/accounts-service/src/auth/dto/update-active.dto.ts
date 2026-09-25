import { IsBoolean } from 'class-validator';

export class UpdateActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
