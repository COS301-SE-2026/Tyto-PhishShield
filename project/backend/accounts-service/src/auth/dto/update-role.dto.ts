import { UserRole } from '@phishshield/dto';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
