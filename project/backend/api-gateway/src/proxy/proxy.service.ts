/**
 * ProxyService — service that performs HTTP proxying and request forwarding.
 *
 * - Used by controllers to forward or transform requests to downstream services.
 */
import {
  Injectable,
  HttpException,
  InternalServerErrorException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AxiosRequestConfig } from 'axios';
import httpProxy from 'http-proxy';
import { logger } from '../logger/logger.service';
import type { Request, Response } from 'express';
import { ClientRequest } from 'http';
import { RouteResolver } from './proxy.routes';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as fs from 'fs';

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
export class ProxyService implements OnModuleInit {
  private readonly proxy = httpProxy.createProxyServer({
    xfwd: true,
    changeOrigin: false,
    proxyTimeout: 30000,
    timeout: 30000,
  });
  private readonly httpsAgent: https.Agent;

  constructor(
    private readonly http: HttpService,
    private readonly router: RouteResolver,
    private readonly config: ConfigService,
    @Inject('ACCOUNTS_SERVICE') public readonly accountsClient: ClientProxy,
    @Inject('MAILING_SERVICE') public readonly mailingClient: ClientProxy,
    @Inject('XP_SERVICE') public readonly xpClient: ClientProxy,
    @Inject('REPORT_SERVICE') public readonly reportClient: ClientProxy,
    @Inject('EDUCATION_SERVICE') public readonly educationClient: ClientProxy,
    @Inject('ANALYTICS_SERVICE') public readonly analyticsClient: ClientProxy,
    @Inject('LLM_SERVICE') public readonly llmClient: ClientProxy,
    @Inject('COMPANY_SERVICE') public readonly companyClient: ClientProxy,
    @Inject('COMMS_SERVICE') public readonly commsClient: ClientProxy,
  ) {
    this.httpsAgent = new https.Agent({
      ca: fs.readFileSync(
        this.config.getOrThrow<string>('NODE_EXTRA_CA_CERTS'),
      ),
      cert: fs.readFileSync(
        this.config.getOrThrow<string>('TLS_CERT_PATH'),
      ),
      key: fs.readFileSync(
        this.config.getOrThrow<string>('TLS_KEY_PATH'),
      ),
      rejectUnauthorized: true,
    });

    this.proxy.on('error', () => {
      throw new InternalServerErrorException(
        'Could not reach downstream service',
      );
    });

    this.proxy.on('proxyReq', this.handleProxy.bind(this));

    this.proxy.on('proxyRes', (proxyRes, req) => {
      logger.info(String(proxyRes.statusCode) + ',' + req.url);
    });
  }

  async onModuleInit() {
    await this.connectService(this.accountsClient, 'Accounts');
    await this.connectService(this.mailingClient, 'Mailing');
    await this.connectService(this.xpClient, 'XP');
    await this.connectService(this.reportClient, 'Report');
    await this.connectService(this.educationClient, 'Education');
    await this.connectService(this.analyticsClient, 'Analytics');
    await this.connectService(this.llmClient, 'llm');
    await this.connectService(this.companyClient, 'company');
    await this.connectService(this.commsClient, 'comms');
  }

  private async connectService(client: ClientProxy, serviceName: string) {
    try {
      await client.connect();
    } catch (err) {
      logger.warn(serviceName + ' TCP connection unavailable: ', err);
      setTimeout(() => void this.connectService(client, serviceName), 10000);
    }
  }

  async sendTcpMessage(
    client: ClientProxy,
    message: string,
    data: any = {},
  ): Promise<any> {
    logger.info('Sending TCP message: ' + message);
    return firstValueFrom(client.send(message, data));
  }

  private handleProxy(proxyReq: ClientRequest, req: Request) {
    proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] ?? '');
    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const body = JSON.stringify(req.body);
      proxyReq.setHeader(
        'Content-Type',
        req.headers['content-type'] || 'application/json',
      );
      proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
      proxyReq.write(body);
    }

    logger.info(req.method + ',' + req.url);
  }

  beterForward(req: Request, res: Response) {
    const route = this.router.resolve(req.originalUrl);
    req.url = req.url.replace(route.apiRoute, '');
    this.proxy.web(req, res, { target: route.targetService, agent: this.httpsAgent, secure: true });
  }

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
        response: downstream.response?.status,
        message: downstream.message,
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
