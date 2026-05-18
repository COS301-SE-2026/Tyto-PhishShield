import {
  Injectable, ConflictException,
  UnauthorizedException, InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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

  async register(dto: RegisterDto): Promise<{ message: string; userId: string }> {
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
        throw new ConflictException('An account with this email already exists');
      }
      throw new InternalServerErrorException('Could not create account, please try again');
    }

    const user = await this.usersService.create({
      auth0Id: auth0User.user_id,
      email: dto.email,
      name: dto.name,
      role: UserRole.USER,
    });

    return { message: 'Registration successful', userId: user.id };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; expires_in: number }> {
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
      console.error('Login error:', axiosErr.response?.data ?? axiosErr.message);
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}