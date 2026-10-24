import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logs, type Logger } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';

@Injectable()
export class PostHogLogsService implements OnModuleInit, OnApplicationShutdown {
  private sdk?: NodeSDK;
  private logger?: Logger;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectToken = this.config.get<string>('POSTHOG_PROJECT_TOKEN');
    const host = this.config.get<string>('POSTHOG_HOST');

    if (!projectToken || !host) {
      if (process.env.NODE_ENV !== 'production') {
        const missingVariable = projectToken
          ? 'POSTHOG_HOST'
          : 'POSTHOG_PROJECT_TOKEN';
        throw new Error(
          `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
        );
      }

      return;
    }

    this.sdk = new NodeSDK({
      resource: resourceFromAttributes({
        'service.name': 'api-gateway',
      }),
      logRecordProcessors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${host.replace(/\/$/, '')}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${projectToken}`,
            },
          }),
        }),
      ],
    });
    this.sdk.start();

    this.logger = logs.getLogger('posthog-api-gateway');
    this.logger.emit({
      severityText: 'INFO',
      body: 'posthog_logs_exporter_initialized',
      attributes: { component: 'posthog_logs' },
    });
  }

  logGatewayListening(port: number | string) {
    this.logger?.emit({
      severityText: 'INFO',
      body: 'api_gateway_listening',
      attributes: { component: 'api_gateway', port: String(port) },
    });
  }

  async onApplicationShutdown() {
    await this.sdk?.shutdown();
  }
}
