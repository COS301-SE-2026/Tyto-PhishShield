import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

interface MicrosoftTokenPayload {
  sub: string;
  oid: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  tid?: string;
}

interface MicrosoftUserInfo {
  microsoftId: string;
  email: string;
  name?: string;
  tenantId?: string;
}

@Injectable()
export class MicrosoftService {
  private readonly jwksClient: jwksRsa.JwksClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.jwksClient = jwksRsa({
      cache: true,
      rateLimit: true,
      jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
    });
  }

  private getKey(
    header: jwt.JwtHeader,
    callback: jwt.SigningKeyCallback,
  ): void {
    this.jwksClient.getSigningKey(header.kid ?? '', (err, key) => {
      if (err) {
        return callback(err);
      }

      if (!key || !(key as unknown as { getPublicKey?: () => string })?.getPublicKey) {
        return callback(new Error('Failed to retrieve signing key'));
      }

      const signingKey = (key as unknown as { getPublicKey: () => string }).getPublicKey();

      callback(null, signingKey);
    });
  }

  async validateToken(token: string): Promise<MicrosoftUserInfo> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getKey.bind(this),
        { algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) {
            return reject(new UnauthorizedException('Invalid Microsoft token'));
          }
          const payload = decoded as MicrosoftTokenPayload;
          const email = payload.email ?? payload.preferred_username;
          if (!email) {
            return reject(
              new UnauthorizedException('Email not found in Microsoft token'),
            );
          }

          resolve({
            microsoftId: payload.oid ?? payload.sub,
            email,
            name: payload.name,
            tenantId: payload.tid,
          });
        },
      );
    });
  }

  async exchangeToken(microsoftToken: string): Promise<MicrosoftUserInfo> {
    return this.validateToken(microsoftToken);
  }
}
