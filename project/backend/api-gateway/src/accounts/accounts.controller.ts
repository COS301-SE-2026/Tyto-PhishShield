import {
  Controller, Post, Get, Body, Req,
  UseGuards, HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  private readonly accountsServiceUrl: string;

  constructor(
    private readonly proxy: ProxyService,
    private readonly config: ConfigService,
  ) {
    this.accountsServiceUrl = this.config.get<string>(
      'ACCOUNTS_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  // -------------------------------------------------------------------------
  // POST /api/accounts/auth/register
  // Public — no JWT required
  // Forwards the registration payload to the accounts service
  // -------------------------------------------------------------------------
  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/register`,
      method: 'POST',
      data: body,
    });
  }

  // -------------------------------------------------------------------------
  // POST /api/accounts/auth/login
  // Public — no JWT required
  // Forwards credentials to the accounts service, which calls Auth0
  // Returns the JWT to the frontend
  // -------------------------------------------------------------------------
  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login and receive a JWT' })
  login(@Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/login`,
      method: 'POST',
      data: body,
    });
  }

  // -------------------------------------------------------------------------
  // GET /api/accounts/auth/me
  // Protected — JWT required
  // The gateway validates the JWT, then returns the user info from the token.
  // No need to call the accounts service again since we already have the data.
  // -------------------------------------------------------------------------
  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  getMe(@Req() req: AuthenticatedRequest): GatewayUser {
    return req.user;
  }
}