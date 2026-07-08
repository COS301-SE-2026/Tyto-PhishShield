/**
 * ProxyService — service that performs HTTP proxying and request forwarding.
 *
 * - Used by controllers to forward or transform requests to downstream services.
 */
import {
  Injectable,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '../logger/logger.service';

interface ForwardOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
  requestId?: string;
  logger?: typeof logger;
}

interface DownstreamErrorShape {
  response?: {
    status: number;
    data?: unknown;
  };
  message?: string;
}

@Injectable()
export class ProxyService {
  constructor(private readonly http: HttpService) {}

  async forward<T>(options: ForwardOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      url: options.url,
      method: options.method,
      data: options.data,
      headers: options.headers ?? {},
    };

    const requestLogger =
      options.logger || options.requestId
        ? logger.child({ requestId: options.requestId })
        : logger;

    try {
      requestLogger.info('Proxy forwarding request', {
        method: options.method,
        url: options.url,
      });

      const { data } = await firstValueFrom(this.http.request<T>(config));

      return data;
    } catch (err: unknown) {
      const downstream = err as DownstreamErrorShape;

      requestLogger.error('Proxy request failed', {
        url: options.url,
        downstream,
      });

      if (downstream.response?.status) {
        throw new HttpException(
          downstream.response.data ?? 'Downstream service error',
          downstream.response.status,
        );
      }

      throw new InternalServerErrorException(
        'Could not reach downstream service',
      );
    }
  }
}
