import { Injectable, Logger } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';
import { MistakeCategory } from '@phishshield/dto';

interface IncorrectCategoryCount {
  category: MistakeCategory;
  count: number;
}

interface FailedCategoriesResult {
  auth0Id: string;
  categoryCounts: IncorrectCategoryCount[];
}

const FAILED_CATEGORIES_TIMEOUT_MS = 3000;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly proxyService: ProxyService) {}

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

  private isFailedCategoriesResult(
    value: unknown,
  ): value is FailedCategoriesResult {
    return (
      typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as FailedCategoriesResult).categoryCounts)
    );
  }
}
