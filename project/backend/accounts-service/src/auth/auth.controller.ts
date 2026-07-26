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
  Param,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { ExtendedLoginDto, LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

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
  async login(@Req() req: Request, @Body() dto: LoginDto, res: Response) {
    const extendedDto: ExtendedLoginDto = {
      email: dto.email,
      password: dto.password,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      deviceToken: req.cookies?.deviceToken,
    }
    const {access_token, expires_in, deviceToken } = await this.authService.login(extendedDto);
    res.cookie(
      'device_token',
      deviceToken,
      {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 24 * 60 * 60 * 1000,
      },
    );
    return { access_token, expires_in };
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

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteOwnAccount(@Req() req: AuthenticatedRequest) {
    await this.authService.deleteUser(req.user.auth0Id);
    await this.usersService.removeByAuth0Id(req.user.auth0Id);
  }

  @Get('users/:auth0id')
  @UseGuards(JwtAuthGuard)
  async getUserByAuth0Id(@Param('auth0id') auth0Id: string) {
    const user = await this.usersService.findByAuth0Id(auth0Id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }

  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }
}
