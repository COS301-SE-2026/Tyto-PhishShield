/**
 * Mirror of the LLM service's MistakeCategory enum.
 *
 * TODO: move this to @phishshield/dto once the LLM service interface is
 * finalized. Until then, keep the string values in sync with the LLM
 * service's enum. Any mismatch will silently miss every event.
 */
export enum MistakeCategory {
  VALID_RESPONSE = 'valid_response',
  LOGIN_DETAILS_LEAKED = 'login_details_leaked',
  SECRETS_LEAKED = 'secrets_leaked',
  PII_LEAKED = 'pii_leaked',
  FINANCIAL_INFO_LEAKED = 'financial_info_leaked',
  NEEDS_REVIEW = 'needs_review',
}

/**
 * Categories that warrant a targeted education assignment.
 * The others are either "correct behavior" or "unknown".
 */
export const ACTIONABLE_MISTAKE_CATEGORIES: readonly MistakeCategory[] = [
  MistakeCategory.LOGIN_DETAILS_LEAKED,
  MistakeCategory.SECRETS_LEAKED,
  MistakeCategory.FINANCIAL_INFO_LEAKED,
  MistakeCategory.PII_LEAKED,
];

/**
 * Priority when a message falls into multiple categories.
 * Earlier = higher priority. The education service targets the
 * highest-priority actionable category.
 */
export const MISTAKE_PRIORITY: readonly MistakeCategory[] = [
  MistakeCategory.LOGIN_DETAILS_LEAKED,
  MistakeCategory.SECRETS_LEAKED,
  MistakeCategory.FINANCIAL_INFO_LEAKED,
  MistakeCategory.PII_LEAKED,
];
