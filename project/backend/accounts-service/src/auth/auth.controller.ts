/**
 * AuthController — exposes authentication endpoints for registration and login.
 *
 * - Provides `register`, `login`, and an authenticated `me` endpoint for user info.
 */
import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout() {
    return this.authService.logout();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: AuthenticatedRequest): AuthenticatedUser {
    return req.user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.auth0Id, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.auth0Id, dto);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteOwnAccount(@Req() req: AuthenticatedRequest) {
    await this.authService.deleteUser(req.user.auth0Id);
    await this.usersService.removeByAuth0Id(req.user.auth0Id);
  }
}
