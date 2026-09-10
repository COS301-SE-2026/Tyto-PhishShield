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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Department, RegisterDto, UserRole } from '@phishshield/dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService, CreateUserInput } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
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

  async register(
    dto: RegisterDto,
  ): Promise<{ response: string; message: string }> {
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

    return {
      response: 'ok',
      message:
        'Registration successful. Please verify your email with the verifcation sent to you.',
    };
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
    await this.updateAuth0UserProfile(auth0Id, dto);
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

  async getAuth0UserByAuth0Id(auth0ID: string): Promise<Auth0UserResponse> {
    const mgmtToken = await this.getManagementToken();
    const { data } = await firstValueFrom(
      this.http.get<Auth0UserResponse>(
        `https://${this.DOMAIN}/api/v2/users/${auth0ID}`,
        {
          headers: {
            Authorization: `Bearer ${mgmtToken}`,
            Accept: 'application/json',
          },
        },
      ),
    );
    return data;
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

  async updateAuth0UserRole(auth0Id: string, roles: UserRole[]): Promise<void> {
    const mgmtToken = await this.getManagementToken();

    // Remove existing roles
    const userRoles = await this.getAuth0UserRoles(auth0Id);
    const rollIDsToRemove = userRoles.map((r) => r.id);
    if (rollIDsToRemove.length > 0) {
      await firstValueFrom(
        this.http.delete(
          `https://${this.DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}/roles`,
          {
            headers: {
              Authorization: `Bearer ${mgmtToken}`,
              'Content-Type': 'application/json',
            },
            data: { roles: rollIDsToRemove },
          },
        ),
      );
    }

    // Find IDs of desired roles
    const allRoles = await this.getAuth0Roles();
    const rollIDsToAdd: string[] = [];
    for (const roleName of roles) {
      const found = allRoles.find((r) => r.name === roleName);
      if (found) rollIDsToAdd.push(found.id);
    }

    if (rollIDsToAdd.length > 0) {
      await firstValueFrom(
        this.http.post(
          `https://${this.DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}/roles`,
          { roles: rollIDsToAdd },
          {
            headers: {
              Authorization: `Bearer ${mgmtToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    }
  }

  private async verifyPassword(
    email: string,
    password: string,
  ): Promise<boolean> {
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

  async changePassword(
    auth0Id: string,
    email: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Verify current password
    const valid = await this.verifyPassword(email, dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const mgmtToken = await this.getManagementToken();

    try {
      await firstValueFrom(
        this.http.patch(
          `https://${this.DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,
          { password: dto.newPassword },
          { headers: { Authorization: `Bearer ${mgmtToken}` } },
        ),
      );
    } catch (err: unknown) {
      const e = err as AxiosErrorShape;
      console.error('Change password error:', e.response?.data ?? e.message);
      throw new InternalServerErrorException('Failed to change password');
    }

    return { message: 'Password updated successfully' };
  }

  async updateAuth0UserProfile(
    auth0Id: string,
    data: { name?: string; department?: Department },
  ): Promise<void> {
    const mgmtToken = await this.getManagementToken();

    try {
      await firstValueFrom(
        this.http.patch(
          `https://${this.DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,
          {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.department !== undefined && {
              user_metadata: { department: data.department },
            }),
          },
          { headers: { Authorization: `Bearer ${mgmtToken}` } },
        ),
      );
    } catch (err: unknown) {
      const e = err as AxiosErrorShape;
      console.error(
        'Update Auth0 profile error:',
        e.response?.data ?? e.message,
      );
      throw new InternalServerErrorException(
        'Failed to sync profile with Auth0',
      );
    }
  }

  async blockUser(auth0Id: string): Promise<void> {
    const mgmtToken = await this.getManagementToken();
    await firstValueFrom(
      this.http.patch(
        `https://${this.DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,
        { blocked: true },
        { headers: { Authorization: `Bearer ${mgmtToken}` } },
      ),
    );
  }

  async unblockUser(auth0Id: string): Promise<void> {
    const mgmtToken = await this.getManagementToken();
    await firstValueFrom(
      this.http.patch(
        `https://${this.DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,
        { blocked: false },
        { headers: { Authorization: `Bearer ${mgmtToken}` } },
      ),
    );
  }

  async isActive(auth0ID: string): Promise<boolean> {
    if (auth0ID && (await this.userSyncService.needSyncing(auth0ID))) {
      const auth0User = await this.getAuth0UserByAuth0Id(auth0ID);
      const createDbUser: CreateUserInput = {
        auth0Id: auth0User.user_id,
        email: auth0User.email,
        name: auth0User.name,
        role: (await this.getAuth0UserRoles(auth0ID))[0]?.name ?? UserRole.USER,
        isVerified: false,
      };
      void this.userSyncService.syncAuth0User(createDbUser);
    }
    const role =
      (await this.getAuth0UserRoles(auth0ID))[0]?.name ?? UserRole.USER;
    const user = await this.usersService.findByAuth0Id(auth0ID);
    if (user?.role !== role) {
      this.usersService.updateRole(auth0ID, role);
    }
    if (user && !user.isActive) {
      throw new UnauthorizedException(
        'Account is deactivated. Please contact support.',
      );
    }
    return user?.isActive ?? false;
  }
}
