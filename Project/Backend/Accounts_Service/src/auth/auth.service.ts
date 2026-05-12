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

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly usersService: UsersService,
  ) {}

  private async getManagementToken(): Promise<string> {
    const domain = this.config.get('AUTH0_DOMAIN');
    const { data } = await firstValueFrom(
      this.http.post(`https://${domain}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.get('AUTH0_M2M_CLIENT_ID'),
        client_secret: this.config.get('AUTH0_M2M_CLIENT_SECRET'),
        audience: `https://${domain}/api/v2/`,
      }),
    );
    return data.access_token;
  }

  async register(dto: RegisterDto) {
    const domain = this.config.get('AUTH0_DOMAIN');

    const mgmtToken = await this.getManagementToken();

    let auth0User: any;
    try {
      const { data } = await firstValueFrom(
        this.http.post(
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
    } catch (err) {
      if (err.response?.status === 409) {
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

  async login(dto: LoginDto) {
    const domain = this.config.get('AUTH0_DOMAIN');

    try {
      const { data } = await firstValueFrom(
        this.http.post(`https://${domain}/oauth/token`, {
          grant_type: 'password', 
          username: dto.email,
          password: dto.password,
          audience: this.config.get('AUTH0_AUDIENCE'),
          scope: 'openid profile email',
          client_id: this.config.get('AUTH0_CLIENT_ID'),
          client_secret: this.config.get('AUTH0_CLIENT_SECRET'),
        }),
      );

      return {
        access_token: data.access_token,
        expires_in: data.expires_in,
      };
    } catch {
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}