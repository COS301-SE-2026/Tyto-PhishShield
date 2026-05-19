
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

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

  private async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    const senderEmail = this.config.get<string>('RESEND_EMAIL', 'onboarding@resend.dev');

    try {
      await firstValueFrom(
        this.http.post(
          'https://api.resend.com/emails',
          {
            from: `PhishShield Verification <${senderEmail}>`,
            to: [email],
            subject: 'Your PhishShield Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333;">Welcome to Tyto PhishShield!</h2>
                <p>Please use the following One-Time Password (OTP) to complete your registration process:</p>
                <div style="background-color: #f4f4f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; margin: 20px 0; border-radius: 5px;">
                  ${otpCode}
                </div>
                <p style="color: #666; font-size: 12px;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
              </div>
            `,
          },
          {
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (err) {
      console.error('Failed to send OTP via Resend:', err);

    }
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; userId: string }> {
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


    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15); 

    const user = await this.usersService.create({
      auth0Id: auth0User.user_id,
      email: dto.email,
      name: dto.name,
      role: UserRole.USER,
      isOtpVerified: false,
      otpCode: generatedOtp,
      otpExpiresAt: expiryTime,
    });

    await this.sendOtpEmail(dto.email, generatedOtp);

    return { message: 'Registration successful. Please verify your OTP.', userId: user.id };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {

    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user) {
      throw new BadRequestException('Invalid email or OTP code');
    }

    if (user.isOtpVerified) {
      throw new BadRequestException('Account is already verified. Please proceed to login.');
    }

    if (user.otpCode !== dto.code) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP code has expired. Please register again.');
    }
    user.isOtpVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.usersService.update(user.id, user);

    return { message: 'OTP verified successfully. You may now log in.' };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; expires_in: number }> {
    const localUser = await this.usersService.findByEmail(dto.email);
    
    if (!localUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!localUser.isOtpVerified) {
      throw new UnauthorizedException('Please verify your email via OTP before logging in.');
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
}