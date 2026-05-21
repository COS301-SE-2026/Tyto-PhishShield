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

interface ForwardOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
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

    try {
      const { data } = await firstValueFrom(this.http.request<T>(config));
      return data;
    } catch (err: unknown) {
      const downstream = err as DownstreamErrorShape;

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
