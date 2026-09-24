import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Resend } from 'resend';

@Injectable()
export class ResendWebhookGuard implements CanActivate {
  private readonly logger = new Logger(ResendWebhookGuard.name);
  private readonly resend: Resend;
  private readonly secret: string;
  private readonly skip: boolean;

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.secret = config.getOrThrow<string>('RESEND_RECEIVED_WEBHOOK_SECRET');
    this.skip =
      config.get<string>('RESEND_WEBHOOK_SKIP_VERIFY') === 'true' &&
      config.get<string>('NODE_ENV') !== 'production';
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.skip) {
      this.logger.warn('Webhook signature verification is DISABLED (dev only)');
      return true;
    }

    const req = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const id = req.header('svix-id');
    const timestamp = req.header('svix-timestamp');
    const signature = req.header('svix-signature');

    if (!req.rawBody || !id || !timestamp || !signature) {
      const missing: string[] = [];
      if (!req.rawBody) missing.push('rawBody');
      if (!id) missing.push('svix-id');
      if (!timestamp) missing.push('svix-timestamp');
      if (!signature) missing.push('svix-signature');

      if (missing.length) {
        this.logger.warn(`Webhook rejected, missing: ${missing.join(', ')}`);
        throw new BadRequestException(`Missing: ${missing.join(', ')}`);
      }

      throw new BadRequestException('Missing raw body or Svix headers');
    }

    try {
      this.resend.webhooks.verify({
        payload: req.rawBody.toString('utf8'),
        headers: { id, timestamp, signature },
        webhookSecret: this.secret,
      });
      return true;
    } catch {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
