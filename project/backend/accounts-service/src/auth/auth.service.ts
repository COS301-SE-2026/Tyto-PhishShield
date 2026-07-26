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
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { OtpService } from '../otp/otp.service';
import { ExtendedVerifyOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
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
  email_verfied: boolean;
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

  async register(dto: RegisterDto): Promise<{ message: string }> {
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

    //await this.otpService.generateAndSend(dto.email);

    return {
      message:
        'Registration successful. Please verify your email with the OTP sent to you.',
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; expires_in: number; requiresOTP: boolean }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (user && !user.isActive) {
      throw new UnauthorizedException(
        'Account is deactivated. Please contact support.',
      );
    }

    const domain = this.config.get<string>('AUTH0_DOMAIN');
    const mgmtToken = await this.getManagementToken();
    try {
      const { data } = await firstValueFrom(
        this.http.get<Auth0UserResponse>(
          `https://${domain}/api/v2/users-by-email?email=${dto.email}`,
          {
            headers: {
              Authorization: `Bearer ${mgmtToken}`,
            },
          },
        ),
      );
      if (data && !data.email_verfied) {
        throw new UnauthorizedException(
          'Email not verified. Please verify your email before logging in. (Note it may take time for the email to be marked as verified.)',
        );
      }
    } catch (err: unknown) {
      if (!(err instanceof UnauthorizedException))
        throw new InternalServerErrorException(
          'Failed to check if account is verified.',
        );
    }

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

      let deviceToken: string = '';
      let requiresOTP: boolean = false;
      if (dto.sendOTP) {
        if (!dto.deviceToken) {
          await this.otpService.generateAndSend(dto.email);
          requiresOTP = true;
        } else {
          if (!await this.otpService.verifyDevice(dto.email, dto.deviceToken)) {
            await this.otpService.generateAndSend(dto.email);
            requiresOTP = true;
          }
        }
      }

      return {
        access_token: data.access_token,
        expires_in: data.expires_in,
        requiresOTP
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

  async verifyOtp(dto: ExtendedVerifyOtpDto): Promise<{ message: string, deviceToken: string }> {
    const { valid, deviceToken }= await this.otpService.verify(dto.email, dto.code, dto.userAgent ?? '', dto.ip ?? '');
    if (!valid) throw new BadRequestException('Invalid or expired OTP code');

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.markVerified(user.auth0Id);
    return { message: 'Email verified successfully. You can now log in.', deviceToken };
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user)
      throw new NotFoundException('No account associated with this email');
    // if (user.isVerified)
    //   throw new BadRequestException('Email is already verified');

    await this.otpService.generateAndSend(dto.email);
    return { message: 'A new OTP code has been sent to your email.' };
  }

  logout(): { message: string } {
    return {
      message: 'Logged out sucessfully. Please discard your access token.',
    };
  }

  async updateProfile(
    auth0Id: string,
    dto: UpdateProfileDto,
  ): Promise<{ message: string }> {
    await this.usersService.updateProfile(auth0Id, dto);
    return { message: 'Profile updated successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const domain = this.config.get<string>('AUTH0_DOMAIN');

    try {
      await firstValueFrom(
        this.http.post(`https://${domain}/dbconnections/change_password`, {
          client_id: this.config.get<string>('AUTH0_CLIENT_ID'),
          email,
          connection: 'Username-Password-Authentication',
        }),
      );
    } catch {
      throw new InternalServerErrorException(
        'Could not send password reset email',
      );
    }

    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
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
