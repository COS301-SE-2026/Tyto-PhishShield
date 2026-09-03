import { Department } from '../../dto/difficulty-llm-generation.dto';

export const SENDER_DEPARTMENT_PROMPTS: Record<Department, string> = {
  [Department.IT_SECURITY]:
    'Write as if you are a member of the IT & Security department. Use language and framing consistent with technical/security communications (system alerts, access, compliance checks).',
  [Department.FINANCE]:
    'Write as if you are a member of the Finance department. Use language and framing consistent with financial communications (invoices, budgets, approvals, reimbursements).',
  [Department.HR]:
    'Write as if you are a member of Human Resources. Use language and framing consistent with HR communications (policies, benefits, onboarding, employee records).',
  [Department.LEGAL_COMPLIANCE]:
    'Write as if you are a member of Legal & Compliance. Use language and framing consistent with legal/compliance communications (policy updates, audits, mandatory acknowledgements).',
  [Department.OPERATIONS]:
    'Write as if you are a member of Operations. Use language and framing consistent with operational communications (logistics, facilities, process changes).',
  [Department.EXECUTIVE]:
    'Write as if you are a member of Executive leadership. Use language and framing consistent with executive communications (strategic decisions, high-level directives, time-sensitive requests).',
};
