/**
 * AuthService — handles authentication-related operations and Auth0 integration.
 *
 * - Requests management tokens, registers users in Auth0, and validates credentials.
 */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { OtpService } from '../otp/otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

interface Auth0TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface Auth0UserResponse {
  user_id: string;
  email: string;
  name: string;
}

interface Auth0LoginResponse {
  access_token: string;
  expires_in: number;
}

interface AxiosErrorShape {
  response?: {
    status: number;
    data?: unknown;
  };
  message?: string;
}

@Injectable()
export class AuthService {
  private cachedMgmtToken: string | null = null;
  private mgmtTokenExpiry: number = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) {}

  private async getManagementToken(): Promise<string> {
    if (this.cachedMgmtToken && Date.now() < this.mgmtTokenExpiry - 60_000) {
      return this.cachedMgmtToken;
    }

    const domain = this.config.get<string>('AUTH0_DOMAIN');

    const { data } = await firstValueFrom(
      this.http.post<Auth0TokenResponse>(`https://${domain}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.get<string>('AUTH0_M2M_CLIENT_ID'),
        client_secret: this.config.get<string>('AUTH0_M2M_CLIENT_SECRET'),
        audience: `https://${domain}/api/v2/`,
      }),
    );

    this.cachedMgmtToken = data.access_token;
    this.mgmtTokenExpiry = Date.now() + data.expires_in * 1000;

    return this.cachedMgmtToken;
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; }> {
    const domain = this.config.get<string>('AUTH0_DOMAIN');
    const mgmtToken = await this.getManagementToken();

    let auth0User: Auth0UserResponse;
    try {
      const { data } = await firstValueFrom(
        this.http.post<Auth0UserResponse>(
          `https://${domain}/api/v2/users`,
          {
            email: dto.email,
            password: dto.password,
            name: dto.name ?? dto.email,
            connection: 'Username-Password-Authentication',
          },
          { headers: { Authorization: `Bearer ${mgmtToken}` } },
        ),
      );
      auth0User = data;
    } catch (err: unknown) {
      const axiosErr = err as AxiosErrorShape;
      if (axiosErr.response?.status === 409) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw new InternalServerErrorException(
        'Could not create account, please try again',
      );
    }

    await this.usersService.create({
      auth0Id: auth0User.user_id,
      email: dto.email,
      name: dto.name,
      role: UserRole.USER,
    });

    await this.otpService.generateAndSend(dto.email);

    return { message: 'Registration successful. Please verify your email with the OTP sent to you.' };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; expires_in: number }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (user && !user.isVerified) {
      throw new UnauthorizedException('Email not verified. Please verify your email before logging in.');
    }

    const domain = this.config.get<string>('AUTH0_DOMAIN');

    try {
      const { data } = await firstValueFrom(
        this.http.post<Auth0LoginResponse>(`https://${domain}/oauth/token`, {
          grant_type: 'password',
          username: dto.email,
          password: dto.password,
          audience: this.config.get<string>('AUTH0_AUDIENCE'),
          scope: 'openid profile email',
          client_id: this.config.get<string>('AUTH0_CLIENT_ID'),
          client_secret: this.config.get<string>('AUTH0_CLIENT_SECRET'),
          connection: 'Username-Password-Authentication',
        }),
      );

      return {
        access_token: data.access_token,
        expires_in: data.expires_in,
      };
    } catch (err: unknown) {
      const axiosErr = err as AxiosErrorShape;
      console.error(
        'Login error:',
        axiosErr.response?.data ?? axiosErr.message,
      );
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const valid = await this.otpService.verify(dto.email, dto.code);
    if (!valid) throw new BadRequestException('Invalid or expired OTP code');

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.markVerified(user.auth0Id);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('No account associated with this email');
    if (user.isVerified) throw new BadRequestException('Email is already verified');

    await this.otpService.generateAndSend(dto.email);
    return { message: 'A new OTP code has been sent to your email.' };
  }

  logout(): { message: string } {
    return {
      message: 'Logged out sucessfully. Please discard your access token.',
    };
  }

  async updateProfile(auth0Id: string, dto: UpdateProfileDto): Promise<{message: string}> {
    await this.usersService.updateProfile(auth0Id, dto);
    return { message: 'Profile updated successfully'};
  }

  async changePassword(
    auth0Id: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const domain = this.config.get<string>('AUTH0_DOMAIN');
    const mgmtToken = await this.getManagementToken();

    try {
      await firstValueFrom(
        this.http.patch(
          `https://${domain}/api/v2/users/${encodeURIComponent(auth0Id)}`,
          { password: dto.newPassword },
          { headers: { Authorization: `Bearer ${mgmtToken}` } },
        ),
      );
    } catch (err: unknown) {
      const e = err as AxiosErrorShape;
      if (e.response?.status === 400) {
        throw new InternalServerErrorException(
          'Password does not meet complexity requirements',
        );
      }
      throw new InternalServerErrorException(
        'Failed to change password, please try again',
      );
    }

    return { message: 'Password changed successfylly' };
  }

  async deleteUser(auth0Id: string): Promise<void> {
    const domain = this.config.get<string>('AUTH0_DOMAIN');
    const mgmtToken = await this.getManagementToken();

    try {
      await firstValueFrom(
        this.http.delete(
          `https://${domain}/api/v2/users/${encodeURIComponent(auth0Id)}`,
          { headers: { Authorization: `Bearer ${mgmtToken}` } },
        ),
      );
    } catch (err: unknown) {
      const e = err as AxiosErrorShape;
      if (e.response?.status === 404) {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(
        'Failed to delete user, please try again',
      );
    }
  }
}
