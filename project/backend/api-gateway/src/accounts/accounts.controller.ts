/**
 * AccountsController — lightweight controller exposing account-related routes.
 *
 * - Endpoints here typically proxy requests to the accounts microservice.
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: GatewayUser;
}

interface Auth0UserResponse {
  sub: string;
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
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

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        password: { type: 'string', example: 'Password123!' },
        name: { type: 'string', example: 'Test User' },
      },
    },
  })
  register(@Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/register`,
      method: 'POST',
      data: body,
    });
  }

  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login and receive a JWT' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        password: { type: 'string', example: 'Password123!' },
      },
    },
  })
  login(@Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/login`,
      method: 'POST',
      data: body,
    });
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  async getMe(@Req() req: AuthenticatedRequest): Promise<GatewayUser> {
    if (!req.user || !req.user.email) {
      const token: string = req?.headers?.authorization?.split(' ')[1] ?? '';
      //console.log("Extracted token:", token);
      const data: Auth0UserResponse = await this.proxy.forward({
        url: this.config.get<string>('AUTH0_USERINFO_URL', ''),
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return {
        auth0Id: data?.sub,
        email: data?.email,
        role: req.user.role,
      };
    }
    return req.user;
  }
}
