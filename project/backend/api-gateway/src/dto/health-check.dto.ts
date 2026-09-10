export class HealthServices {
  accountsService?: string;
  mailingService?: string;
  xpService?: string;
  reportService?: string;
  educationService?: string;
  analyticsService?: string;
  llmService?: string;
  companyService?: string;
}

export class Health {
  api_version?: string;
  environment?: string;
  services?: HealthServices;
}
