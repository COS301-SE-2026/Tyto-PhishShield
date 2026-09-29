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

const RECIPIENT_SUFFIX = '_recipient';
const SENDER_SUFFIX = '_sender';

export interface PersonContext {
  user: UserEntity;
  employeeInfo?: EmployeeInfoEntity;
}

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

  substituteSpear(
    text: string,
    recipient: PersonContext,
    sender: PersonContext,
  ): string {
    if (!text) {
      return text;
    }

    return text.replace(VARIABLE_PATTERN, (match, variableName: string) => {
      if (this.reservedVariables.has(variableName)) {
        return match;
      }

      const value = this.resolveSpearVariable(variableName, recipient, sender);

      if (value === undefined) {
        this.logger.error(
          `Spear template uses an unsupported or unavailable variable: ${variableName}`,
        );
        throw new InternalServerErrorException(
          `Template contains an unsupported or unavailable variable: ${variableName}`,
        );
      }

      return value;
    });
  }

  private resolveSpearVariable(
    variableName: string,
    recipient: PersonContext,
    sender: PersonContext,
  ): string | undefined {
    if (variableName === 'business_name') {
      return this.businessName;
    }

    let base: string;
    let person: PersonContext;

    if (variableName.endsWith(RECIPIENT_SUFFIX)) {
      base = variableName.slice(0, -RECIPIENT_SUFFIX.length);
      person = recipient;
    } else if (variableName.endsWith(SENDER_SUFFIX)) {
      base = variableName.slice(0, -SENDER_SUFFIX.length);
      person = sender;
    } else {
      return undefined;
    }

    if (base === 'business_name') {
      return undefined;
    }

    return this.resolveVariable(base, person.user, person.employeeInfo);
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
        if (!user.firstName) {
          return user.name;
        } else {
          return user.firstName;
        }

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
