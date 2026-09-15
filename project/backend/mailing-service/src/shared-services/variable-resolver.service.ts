import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.entity';

// Looks for a variable like {{...}}, for example, {{name}}.
const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

type UserVariableResolver = (user: UserEntity) => string | undefined;

@Injectable()
export class VariableResolverService {
  private readonly logger = new Logger(VariableResolverService.name);
  private readonly businessName: string;
  private readonly reservedVariables = new Set(['tracking_link']);

  private readonly staticVariableResolvers: Record<
    string,
    () => string | undefined
  >;

  // Add new variables here.
  private readonly userVariableResolvers: Record<string, UserVariableResolver> =
    {
      name: (user) => user.name?.split(' ')[0],
      department: (user) => user.department,
    };

  constructor(private readonly configService: ConfigService) {
    this.businessName = this.configService.get<string>(
      'BUSINESS_NAME',
      'FiveGuys',
    );
    this.staticVariableResolvers = {
      business_name: () => this.businessName,
    };
  }

  substitute(text: string, referenceNumber: string, user: UserEntity): string {
    if (!text) {
      return text;
    }

    return text.replace(VARIABLE_PATTERN, (match, variableName: string) => {
      if (this.reservedVariables.has(variableName)) {
        return match;
      }

      const value =
        this.staticVariableResolvers[variableName]?.() ??
        this.userVariableResolvers[variableName]?.(user);

      if (value === undefined) {
        this.logger.error(
          `Template "${referenceNumber}" uses an unsupported or unavailable variable: ${variableName}`,
        );
        throw new InternalServerErrorException(
          `Template "${referenceNumber}" contains an unsupported or unavailable variable: {{${variableName}}}`,
        );
      }

      return value;
    });
  }
}
