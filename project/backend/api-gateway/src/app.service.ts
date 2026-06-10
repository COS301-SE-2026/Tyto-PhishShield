/**
 * AppService — small application-level service.
 *
 * - Exposes utility methods used by the `AppController` for simple responses.
 */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HealthServices } from './dto/health-check.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject('ACCOUNTS_SERVICE') private readonly accountsClient: ClientProxy,
    @Inject('MAILING_SERVICE') private readonly mailingClient: ClientProxy,
    @Inject('XP_SERVICE') private readonly xpClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
  ) {}

  onModuleInit() {
    this.connectService(this.accountsClient, 'Accounts');
    this.connectService(this.mailingClient, 'Mailing');
    this.connectService(this.xpClient, 'XP');
    this.connectService(this.reportClient, 'Report');
  }

  private async connectService(client: ClientProxy, serviceName: string) {
    try {
      await client.connect();
    } catch (err) {
      console.warn(serviceName + ' TCP connection unavailable: ', err);
      setTimeout(() => void this.connectService(client, serviceName), 10000);
    }
  }

  async checkMicroServicesHealth(): Promise<HealthServices> {
    const healthServices: HealthServices = {
      accountsService: await this.checkServiceHealth(this.accountsClient),
      mailingService: await this.checkServiceHealth(this.mailingClient),
      xpService: await this.checkServiceHealth(this.xpClient),
      reportService: await this.checkServiceHealth(this.reportClient),
    };

    return healthServices;
  }

  private async checkServiceHealth(client: ClientProxy): Promise<string> {
    try {
      return await firstValueFrom(
        client.send('health.check', {}),
      );
    } catch {
      return 'unavailable';
    }
  }
}
