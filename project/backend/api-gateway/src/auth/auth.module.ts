/**
 * AuthModule — authentication wiring for the API Gateway.
 *
 * - Registers JWT strategy and any auth-related providers used by guarded routes.
 */
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthModule {}
