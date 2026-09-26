import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';

// Looks for a variable like {{...}}, for example, {{name}}.
const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

@Injectable()
export class VariableResolverService {
  private readonly logger = new Logger(VariableResolverService.name);
  private readonly businessName: string;
  private readonly reservedVariables = new Set(['tracking_link']);

  constructor(private readonly configService: ConfigService) {
    this.businessName = this.configService.get<string>(
      'BUSINESS_NAME',
      'FiveGuys',
    );
  }

  substitute(
    text: string,
    user: UserEntity,
    employeeInfo?: EmployeeInfoEntity,
  ): string {
    if (!text) {
      return text;
    }

    return text.replace(VARIABLE_PATTERN, (match, variableName: string) => {
      if (this.reservedVariables.has(variableName)) {
        return match;
      }

      const value = this.resolveVariable(variableName, user, employeeInfo);

      if (value === undefined) {
        this.logger.error(
          `Template uses an unsupported or unavailable variable: ${variableName}`,
        );
        throw new InternalServerErrorException(
          `Template contains an unsupported or unavailable variable: ${variableName}`,
        );
      }

      return value;
    });
  }

  // Add new variables here.
  private resolveVariable(
    variableName: string,
    user: UserEntity,
    employeeInfo?: EmployeeInfoEntity,
  ): string | undefined {
    switch (variableName) {
      case 'business_name':
        return this.businessName;

      case 'name':
        return user.firstName;

      case 'surname':
        return user.lastName;

      case 'department':
        return user.department;

      case 'job_title':
        return employeeInfo?.jobTitle;

      case 'title':
        return employeeInfo?.title;

      default:
        return undefined;
    }
  }
}
