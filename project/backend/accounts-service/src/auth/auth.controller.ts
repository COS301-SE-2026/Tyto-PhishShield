/**
 * AuthController — exposes authentication endpoints for registration and login.
 *
 * - Provides `register`, `login`, and an authenticated `me` endpoint for user info.
 */
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: AuthenticatedRequest): AuthenticatedUser {
    return req.user;
  }

  @Get('by-auth0id/:auth0Id')
  findByAuth0Id(@Param('auth0Id') auth0Id: string) {
    return this.usersService.findByAuth0Id(auth0Id);
  }
}
