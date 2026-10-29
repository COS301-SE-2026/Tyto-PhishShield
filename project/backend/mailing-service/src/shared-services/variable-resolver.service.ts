import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';

// Looks for a variable like {{...}}, for example, {{name}}.
const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

const PLACEHOLDER_PATTERN = /{{\s*([^{}]*?)\s*}}/g;

const RECIPIENT_SUFFIX = '_recipient';
const SENDER_SUFFIX = '_sender';

export interface PersonContext {
  user: UserEntity;
  employeeInfo?: EmployeeInfoEntity;
}

type VariableGetter = (
  user: UserEntity,
  employeeInfo?: EmployeeInfoEntity,
) => string | null;

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

  private readonly variables = new Map<string, VariableGetter>([
    ['business_name', () => this.businessName],
    ['name', (user) => user.firstName || user.name || null],
    ['surname', (user) => user.lastName ?? null],
    ['department', (user) => user.department ?? null],
    ['job_title', (_user, employeeInfo) => employeeInfo?.jobTitle ?? null],
    ['title', (_user, employeeInfo) => employeeInfo?.title ?? null],
  ]);

  substitute(
    text: string,
    user: UserEntity,
    employeeInfo?: EmployeeInfoEntity,
  ): string {
    if (!text) {
      return text;
    }

    this.validateTemplate(text);

    return text.replace(VARIABLE_PATTERN, (match, variableName: string) => {
      if (this.reservedVariables.has(variableName)) {
        return match;
      }

      return this.requireValue(
        this.resolveVariable(variableName, user, employeeInfo),
        variableName,
      );
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

    this.validateSpearTemplate(text);

    return text.replace(VARIABLE_PATTERN, (match, variableName: string) => {
      if (this.reservedVariables.has(variableName)) {
        return match;
      }

      return this.requireValue(
        this.resolveSpearVariable(variableName, recipient, sender),
        variableName,
      );
    });
  }

  private requireValue(
    value: string | null | undefined,
    variableName: string,
  ): string {
    if (value === undefined) {
      this.logger.error(
        `Template uses an unsupported variable: ${variableName}`,
      );
      throw new InternalServerErrorException(
        `Template contains an unsupported variable: ${variableName}`,
      );
    }

    if (value === null || value.trim() === '') {
      this.logger.warn(
        `User does not have a value for variable: ${variableName}`,
      );
      throw new UnprocessableEntityException(
        `User does not have a value for variable: ${variableName}`,
      );
    }

    return value;
  }

  private resolveSpearVariable(
    variableName: string,
    recipient: PersonContext,
    sender: PersonContext,
  ): string | null | undefined {
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
  ): string | null | undefined {
    const getter = this.variables.get(variableName);
    return getter ? getter(user, employeeInfo) : undefined;
  }

  validateTemplate(...texts: Array<string | null | undefined>): void {
    this.assertKnown(texts, (name) => this.isKnownVariable(name));
  }

  validateSpearTemplate(...texts: Array<string | null | undefined>): void {
    this.assertKnown(texts, (name) => this.isKnownSpearVariable(name));
  }

  private isKnownVariable(name: string): boolean {
    return this.reservedVariables.has(name) || this.variables.has(name);
  }

  private isKnownSpearVariable(name: string): boolean {
    if (name === 'business_name' || this.reservedVariables.has(name)) {
      return true;
    }
    for (const suffix of [RECIPIENT_SUFFIX, SENDER_SUFFIX]) {
      if (name.endsWith(suffix)) {
        const base = name.slice(0, -suffix.length);
        return base !== 'business_name' && this.variables.has(base);
      }
    }
    return false;
  }

  private assertKnown(
    texts: Array<string | null | undefined>,
    isKnown: (name: string) => boolean,
  ): void {
    const unknown = new Set<string>();

    for (const text of texts) {
      if (!text) continue;
      for (const [, name] of text.matchAll(PLACEHOLDER_PATTERN)) {
        if (!isKnown(name)) unknown.add(name);
      }
    }

    if (unknown.size > 0) {
      const list = [...unknown].map((v) => `{{${v}}}`).join(', ');
      this.logger.warn(`Template rejected, unknown variable(s): ${list}`);
      throw new BadRequestException(
        `Template contains unknown variable(s): ${list}`,
      );
    }
  }
}
