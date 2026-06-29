/**
 * AccountsController — lightweight controller exposing account-related routes.
 *
 * - Endpoints here typically proxy requests to the accounts microservice.
 */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
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

function authHeader(req: Request): Record<string, string> {
  try {
    const token = req.headers['authorization'];
    return token ? { Authorization: token } : {};
  } catch {
    return {};
  }
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

  @Post('auth/verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify OTP for email verification' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: { type: 'string', example: 'test@example.com' },
        code: { type: 'string', example: '123456' },
      },
    },
  })
  verifyOtp(@Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/verify-otp`,
      method: 'POST',
      data: body,
    });
  }

  @Post('auth/resend-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend OTP for email verification' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'test@example.com' },
      },
    },
  })
  resendOtp(@Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/resend-otp`,
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

  @Post('auth/logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout - client should dicard token after this' })
  logout(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/logout`,
      method: 'POST',
      headers: authHeader(req),
    });
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/me`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Patch('auth/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile (name or email)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'New Name' },
        email: { type: 'string', example: 'newemail@example.com' },
      },
    },
  })
  updateProfile(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/profile`,
      method: 'PATCH',
      data: body,
      headers: authHeader(req),
    });
  }

  @Post('auth/forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a password reset email' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', example: 'test@example.com' } },
    },
  })
  forgotPassword(@Body() body: unknown) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/forgot-password`,
      method: 'POST',
      data: body,
    });
  }

  @Delete('auth/account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete account' })
  deleteOwnAccount(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/account`,
      method: 'DELETE',
      headers: authHeader(req),
    });
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin/analyst only)' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/users`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific user by ID' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/users/${id}`,
      method: 'GET',
      headers: authHeader(req),
    });
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user role (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: {
        role: { type: 'string', enum: ['admin', 'analyst', 'user'] },
      },
    },
  })
  updateRole(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/users/${id}/role`,
      method: 'PATCH',
      data: body,
      headers: authHeader(req),
    });
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  removeUser(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/users/${id}`,
      method: 'DELETE',
      headers: authHeader(req),
    });
  }

  @Get('auth/xp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get XP (total and today) for authenticated user' })
  getMyXp(@Req() req: AuthenticatedRequest) {
    return this.proxy.forward({
      url: `${this.accountsServiceUrl}/api/auth/xp`,
      method: 'GET',
      headers: authHeader(req),
    });
  }
}
