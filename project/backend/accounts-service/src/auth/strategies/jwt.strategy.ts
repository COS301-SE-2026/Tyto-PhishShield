/**
 * JwtStrategy — Passport strategy for verifying Auth0-issued JWTs (Accounts service).
 *
 * - Fetches signing keys via `jwks-rsa` and validates tokens used by the service.
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  auth0Id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService,
              private readonly usersService: UsersService
  ) {
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

  async validate(payload:JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByAuth0Id(payload.sub);

    return {
      auth0Id: payload.sub,
      email: payload.email,
      role: user ? user.role : 'USER',
    }
  }
}
