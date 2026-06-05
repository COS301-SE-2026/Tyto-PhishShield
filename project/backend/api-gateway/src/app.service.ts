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
    @Inject('XP_SERVICE') private readonly xpClient: ClientProxy,
    @Inject('REPORT_SERVICE') private readonly reportClient: ClientProxy,
  ) {}

  onModuleInit() {
    this.connectXPService();
    this.connectReportService();
  }

  private async connectXPService() {
    try {
      await this.xpClient.connect();
    } catch (err) {
      console.warn('XP TCP connection unavailable: ', err);
      setTimeout(() => void this.connectXPService(), 10000);
    }
  }

  private async connectReportService() {
    try {
      await this.reportClient.connect();
    } catch (err) {
      console.warn('Report TCP connection unavailable: ', err);
      setTimeout(() => void this.connectReportService(), 10000);
    }
  }

  async checkMicroServiceHealth(): Promise<HealthServices> {
    const healthServices: HealthServices = {
      xpService: 'unavailable',
      reportService: 'unavailable',
    };
    try {
      healthServices.xpService = await firstValueFrom(
        this.xpClient.send('health.check', {}),
      );
    } catch {
      healthServices.xpService = 'unavailable';
    }
    try {
      healthServices.reportService = await firstValueFrom(
        this.reportClient.send('health.check', {}),
      );
    } catch {
      healthServices.reportService = 'unavailable';
    }

    return healthServices;
  }
}
