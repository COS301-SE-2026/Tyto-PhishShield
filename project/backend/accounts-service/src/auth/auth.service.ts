/**
 * Service: AuthService
 *
 * Handles all authentication operations – registration, login,
 * OTP verification, password reset, profile updates, and account deletion.
 * Integrates with Auth0 for identity management and uses
 * {@link UsersService} and {@link OtpService} for local persistence and OTP flows.
 *
 * Methods:
 * - {@link AuthService#register} – creates a new user in Auth0 and the local DB
 * - {@link AuthService#login} – validates credentials and returns a JWT (optionally triggers OTP)
 * - {@link AuthService#verifyOtp} – verifies a one‑time password and marks the user as verified
 * - {@link AuthService#resendOtp} – sends a new OTP code
 * - {@link AuthService#logout} – returns a confirmation message (client must discard the token)
 * - {@link AuthService#updateProfile} – updates the user’s name or department
 * - {@link AuthService#forgotPassword} – sends a password‑reset email via Auth0
 * - {@link AuthService#deleteUser} – removes the user from Auth0
 * - {@link AuthService#getAuth0UserByEmail} – fetches user metadata from Auth0 by email
 */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService, CreateUserInput } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { OtpService } from '../otp/otp.service';
import { ExtendedVerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { UserSyncService } from '../users/user-sync.service';

interface Auth0TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface Auth0UserResponse {
  user_id: string;
  email: string;
  name: string;
  email_verified: boolean;
}

interface Auth0LoginResponse {
  access_token: string;
  expires_in: number;
}

interface Auth0Roles {
  id: string;
  name: UserRole;
  description: string;
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
  private readonly DOMAIN: string;
  

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly usersService: UsersService,
    private readonly userSyncService: UserSyncService,
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
  ) {
    this.DOMAIN = this.config.getOrThrow<string>('AUTH0_DOMAIN');
  }

  private async getManagementToken(): Promise<string> {
    if (this.cachedMgmtToken && Date.now() < this.mgmtTokenExpiry - 60_000) {
      return this.cachedMgmtToken;
    }

    const { data } = await firstValueFrom(
      this.http.post<Auth0TokenResponse>(`https://${this.DOMAIN}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.get<string>('AUTH0_M2M_CLIENT_ID'),
        client_secret: this.config.get<string>('AUTH0_M2M_CLIENT_SECRET'),
        audience: `https://${this.DOMAIN}/api/v2/`,
      }),
    );

    this.cachedMgmtToken = data.access_token;
    this.mgmtTokenExpiry = Date.now() + data.expires_in * 1000;

    return this.cachedMgmtToken;
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const mgmtToken = await this.getManagementToken();

    let auth0User: Auth0UserResponse;
    try {
      const { data } = await firstValueFrom(
        this.http.post<Auth0UserResponse>(
          `https://${this.DOMAIN}/api/v2/users`,
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
      department: dto.department,
      role: UserRole.USER,
    });

    await this.otpService.generateAndSend(dto.email);

    return {
      message:
        'Registration successful. Please verify your email with the OTP sent to you.',
    };
  }

  async login(dto: LoginDto): Promise<{
    access_token: string;
    expires_in: number;
    requiresOTP: boolean;
  }> {
    let auth0User: Auth0UserResponse;
    try {
      const data = await this.getAuth0UserByEmail(dto.email);
      if (data && !data.email_verified) {
        throw new UnauthorizedException(
          'Email not verified. Please verify your email before logging in. (Note it may take time for the email to be marked as verified.)',
        );
      }
      auth0User = data;
      if (data && (await this.userSyncService.needSyncing(auth0User.user_id))) {
        const createDbUser: CreateUserInput = {
          auth0Id: auth0User.user_id,
          email: data.email,
          name: data.name,
          role:
            (await this.getAuth0UserRoles(auth0User.user_id))[0]?.name ??
            UserRole.USER,
          isVerified: false,
        };
        void this.userSyncService.syncAuth0User(createDbUser);
      }
    } catch (err: unknown) {
      if (!(err instanceof UnauthorizedException)) {
        console.log(err);
        throw new InternalServerErrorException(
          'Failed to check if account is verified.',
        );
      } else {
        throw err;
      }
    }

    const user = await this.usersService.findByAuth0Id(auth0User.user_id);
    if (user && !user.isActive) {
      throw new UnauthorizedException(
        'Account is deactivated. Please contact support.',
      );
    }

    try {
      const { data } = await firstValueFrom(
        this.http.post<Auth0LoginResponse>(
          `https://${this.DOMAIN}/oauth/token`,
          {
            grant_type: 'password',
            username: dto.email,
            password: dto.password,
            audience: this.config.get<string>('AUTH0_AUDIENCE'),
            scope: 'openid profile email',
            client_id: this.config.get<string>('AUTH0_CLIENT_ID'),
            client_secret: this.config.get<string>('AUTH0_CLIENT_SECRET'),
            connection: 'Username-Password-Authentication',
          },
        ),
      );

      let requiresOTP: boolean = false;
      if (dto.sendOTP) {
        if (!dto.deviceToken) {
          await this.otpService.generateAndSend(dto.email);
          requiresOTP = true;
        } else {
          if (
            !(await this.otpService.verifyDevice(dto.email, dto.deviceToken))
          ) {
            await this.otpService.generateAndSend(dto.email);
            requiresOTP = true;
          }
        }
      }

      return {
        access_token: data.access_token,
        expires_in: data.expires_in,
        requiresOTP,
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

  async verifyOtp(
    dto: ExtendedVerifyOtpDto,
  ): Promise<{ message: string; deviceToken: string }> {
    const { valid, deviceToken } = await this.otpService.verify(
      dto.email,
      dto.code,
      dto.userAgent ?? '',
      dto.ip ?? '',
    );
    if (!valid) throw new BadRequestException('Invalid or expired OTP code');

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.markVerified(user.auth0Id);
    return {
      message: 'Email verified successfully. You can now log in.',
      deviceToken,
    };
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
    try {
      await firstValueFrom(
        this.http.post(`https://${this.DOMAIN}/dbconnections/change_password`, {
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
    const mgmtToken = await this.getManagementToken();

    try {
      await firstValueFrom(
        this.http.delete(
          `https://${this.DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,
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

  async getAuth0UserByEmail(email: string): Promise<Auth0UserResponse> {
    const mgmtToken = await this.getManagementToken();
    const { data } = await firstValueFrom(
      this.http.get<Auth0UserResponse[]>(
        `https://${this.DOMAIN}/api/v2/users-by-email?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${mgmtToken}`,
          },
        },
      ),
    );
    return data[0];
  }

  async getAuth0Roles(): Promise<Auth0Roles[]> {
    const mgmtToken = await this.getManagementToken();
    const { data } = await firstValueFrom(
      this.http.get<Auth0Roles[]>(`https://${this.DOMAIN}/api/v2/roles`, {
        headers: {
          Authorization: `Bearer ${mgmtToken}`,
        },
      }),
    );
    console.log(data);
    return data;
  }

  async getAuth0UserRoles(auth0Id: string): Promise<Auth0Roles[]> {
    const mgmtToken = await this.getManagementToken();
    const { data } = await firstValueFrom(
      this.http.get<Auth0Roles[]>(
        `https://${this.DOMAIN}/api/v2/users/${auth0Id}/roles`,
        {
          headers: {
            Authorization: `Bearer ${mgmtToken}`,
          },
        },
      ),
    );
    for (let i = 0; i < data.length; i++) {
      const roll = data[i];
      if (
        roll.name !== UserRole.ADMIN &&
        roll.name !== UserRole.ANALYST &&
        roll.name !== UserRole.USER
      ) {
        data[i].name = UserRole.USER;
      }
    }
    return data;
  }

  async updateAuth0UserRole(auth0Id: string, roles: UserRole[]) {
    const mgmtToken = await this.getManagementToken();
    //Get current roles:
    const userRoles = await this.getAuth0UserRoles(auth0Id);
    const rollIDsToRemove: string[] = [];
    for (const roll of userRoles) {
      rollIDsToRemove.push(roll.id);
    }
    //remove current roles:
    this.http.delete(`https://${this.DOMAIN}/api/v2/users/${auth0Id}/roles`, {
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        roles: rollIDsToRemove,
      },
    });
    //Find roleID that match roles of what we want to add:
    const allRoles = await this.getAuth0Roles();
    const rollIDsToAdd: string[] = [];
    for (let i = 0; i < roles.length; i++) {
      for (const roll of allRoles) {
        if (roll.name === roles[i]) {
          rollIDsToAdd.push(roll.id);
        }
      }
    }
    //Add roles to auth0
    this.http.post(`https://${this.DOMAIN}/api/v2/users/${auth0Id}/roles`, {
      headers: {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        roles: rollIDsToAdd,
      },
    });
  }

  private async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`https://${this.DOMAIN}/oauth/token`, {
          grant_type: 'password',
          username: email,
          password,
          audience: this.config.get<string>('AUTH0_AUDIENCE'),
          scope: 'openid profile email',
          client_id: this.config.get<string>('AUTH0_CLIENT_ID'),
          client_secret: this.config.get<string>('AUTH0_CLIENT_SECRET'),
          connection: 'Username-Password-Authentication',
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
