import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  'https://phishshield/roles'?: string[];
}

export interface AuthenticatedUser {
  auth0Id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${config.get<string>('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config.get<string>('AUTH0_AUDIENCE'),
      issuer: `https://${config.get<string>('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      auth0Id: payload.sub,
      email: payload.email,
      role: payload['https://phishshield/roles']?.[0] ?? 'user',
    };
  }
}
