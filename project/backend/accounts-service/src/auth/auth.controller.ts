/**
 * Controller: AuthController
 * Base path: /api/auth
 *
 * Handles authentication and user‑management endpoints.
 * Delegates business logic to {@link AuthService} and {@link UsersService}.
 *
 * Endpoints:
 * - {@link AuthController#register} – creates a new user account
 * - {@link AuthController#login} – authenticates a user and returns a JWT
 * - {@link AuthController#logout} – confirms token discard
 * - {@link AuthController#getProfile} – returns the authenticated user's profile
 * - {@link AuthController#updateProfile} – updates the user's name or department
 * - {@link AuthController#forgotPassword} – triggers a password‑reset email
 * - {@link AuthController#deleteOwnAccount} – removes the account from Auth0 and DB
 * - {@link AuthController#getUserByAuth0Id} – looks up a user by Auth0 ID
 * - {@link AuthController#verifyOtp} – validates an OTP and sets a secure cookie
 * - {@link AuthController#resendOtp} – sends a new OTP code
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
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { ExtendedVerifyOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  //Deprecated
  @Post('login')
  @HttpCode(200)
  login(@Req() req: Request, @Body() dto: LoginDto) {
    dto.deviceToken = (req.cookies as Record<string, string>)?.device_token;
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

  //Deprecated
  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(
    @Req() req: Request,
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const extendedDto: ExtendedVerifyOtpDto = {
      email: dto.email,
      code: dto.code,
      userAgent: req.header('user-agent') ?? '',
      ip: req.ip,
    };
    const { message, deviceToken } =
      await this.authService.verifyOtp(extendedDto);
    res.cookie('device_token', deviceToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000,
    });
    return { message };
  }

  //Deprecated
  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Get('is-active')
  @HttpCode(200)
  isActive(@Body() body: {authID: string}) {
    return this.authService.isActive(body.authID);
  }
  
  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.auth0Id,
      req.user.email,
      dto,
    );
  }
}
