import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TrackingLinkService {
  private readonly trackingLink: string;

  constructor(private readonly configService: ConfigService) {
    this.trackingLink = this.configService.get<string>(
      'TRACKING_LINK',
      'http://localhost:5050',
    );
  }

  replace(content: string): { content: string; token: string } {
    const token = crypto.randomBytes(6).toString('hex').toUpperCase();
    const replaced = content.replace(
      /{{\s*tracking_link\s*}}/g,
      `${this.trackingLink}/${token}`,
    );
    return { content: replaced, token };
  }
}
