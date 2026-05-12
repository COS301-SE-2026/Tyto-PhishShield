import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${config.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config.get('AUTH0_AUDIENCE'),
      issuer: `https://${config.get('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'], 
    });
  }


  async validate(payload: any) {
    return {
      auth0Id: payload.sub,       
      email: payload.email,
      role: payload['https://phishshield/roles']?.[0] ?? 'user',
    };
  }
}