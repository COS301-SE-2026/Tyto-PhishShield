/**
 * AppService — utility service for the Accounts application.
 *
 * - Provides small helpers used by the `AppController` and health endpoints.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
