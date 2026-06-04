/**
 * AppService — small application-level service.
 *
 * - Exposes utility methods used by the `AppController` for simple responses.
 */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HealthServices } from './dto/health-check.dto';
import { first, firstValueFrom } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject('XP_SERVICE') private readonly xpClient: ClientProxy
  ) {}

  async onModuleInit() {
    this.connectXPService();
  }

  private async connectXPService() {
    try {
      await this.xpClient.connect();
    } catch (err) {
      console.warn('XP TCP connection unavailable');
      setTimeout(() => this.connectXPService(), 10000);
    }
  }

  async checkMicroServiceHealth(): Promise<HealthServices> {
    const healthServices: HealthServices = {
      xpService: "unavailable",
    }
    try {
      healthServices.xpService = await firstValueFrom(this.xpClient.send('health.check', {})) ; 
    } catch (err) {
      healthServices.xpService = "unavailable";
    }

    return healthServices;
  }
}
