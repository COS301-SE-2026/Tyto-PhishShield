import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}