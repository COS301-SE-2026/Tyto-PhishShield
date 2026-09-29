import { Injectable, Logger } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { MistakeCategory } from '@phishshield/dto';
import { ConfigService } from '@nestjs/config';

interface IncorrectCategoryCount {
  category: MistakeCategory;
  count: number;
}

interface FailedCategoriesResult {
  auth0Id: string;
  categoryCounts: IncorrectCategoryCount[];
}

export interface AvailableVariables {
  sender: string[];
  recipient: string[];
}

const FAILED_CATEGORIES_TIMEOUT_MS = 3000;
const AVAILABLE_VARIABLES_TIMEOUT_MS = 3000;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly mailingServiceUrl: string;

  constructor(
    private readonly proxyService: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.mailingServiceUrl = this.config.get<string>(
      'MAILING_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  async resolveStruggleCategory(
    auth0Id: string,
  ): Promise<MistakeCategory | undefined> {
    try {
      const raw: unknown = await Promise.race([
        this.proxyService.sendTcpMessage(
          this.proxyService.companyClient,
          'education.getFailedCategories',
          { auth0Id },
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('education.getFailedCategories timed out')),
            FAILED_CATEGORIES_TIMEOUT_MS,
          ),
        ),
      ]);

      if (
        !this.isFailedCategoriesResult(raw) ||
        raw.categoryCounts.length === 0
      ) {
        return undefined;
      }

      const top = raw.categoryCounts.reduce((best, current) =>
        current.count > best.count ? current : best,
      );

      return top.count > 0 ? top.category : undefined;
    } catch (error) {
      this.logger.warn(
        `Could not resolve struggle category for ${auth0Id}`,
        error,
      );
      return undefined;
    }
  }

  async resolveAvailableVariables(
    senderAuth0Id: string,
    recipientAuth0Id: string,
  ): Promise<AvailableVariables | undefined> {
    try {
      const params = new URLSearchParams({ senderAuth0Id, recipientAuth0Id });
      const raw: unknown = await Promise.race([
        this.proxyService.forward({
          method: 'GET',
          url: `${this.mailingServiceUrl}/sender-resolver/available-variables?${params}`,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('available-variables lookup timed out')),
            AVAILABLE_VARIABLES_TIMEOUT_MS,
          ),
        ),
      ]);

      if (!this.isAvailableVariables(raw)) {
        return undefined;
      }

      this.logger.warn(raw);
      return raw;
    } catch (error) {
      this.logger.warn(
        `Could not resolve available variables for sender ${senderAuth0Id} / recipient ${recipientAuth0Id}, proceeding with full variable set`,
        error,
      );
      return undefined;
    }
  }

  private isFailedCategoriesResult(
    value: unknown,
  ): value is FailedCategoriesResult {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as FailedCategoriesResult).categoryCounts)
    );
  }

  private isAvailableVariables(value: unknown): value is AvailableVariables {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as AvailableVariables).sender) &&
      Array.isArray((value as AvailableVariables).recipient)
    );
  }
}
