/**
 * JwtAuthGuard — route guard that delegates JWT validation to Passport.
 *
 * - Extends Nest's `AuthGuard('jwt')` to protect endpoints that require authentication.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
