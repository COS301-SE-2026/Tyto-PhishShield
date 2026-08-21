/**
 * Service: AccountsService
 *
 * Manages account login and device verification in api-gateway.
 * Sends non-important details to accounts microservice.
 * These details are active or deactive account. (mainly to mark accounts for when they are away)
 * also device tokens (if a token cannot be generated or verified user will just need to enter an otp)
 *
 * Public methods:
 * - {@link AccountsService#login} – logs user in use auth0 and then uses otp service to send an otp
 * Private methodes:
 * - {@link AccountsService#verifyDevice} – checks the device token, if verified then no otp will be sent
 */

import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../proxy/proxy.service';
import { LoginDto } from '../dto/login.dto';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { OtpService } from '../otp/otp.service';
import { logger } from '../logger/logger.service';

interface Auth0UserResponse {
  user_id: string;
  email: string;
  name: string;
  email_verified: boolean;
}

interface Auth0TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface Auth0LoginResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
}

interface AxiosErrorShape {
  response?: {
    status: number;
    data?: unknown;
  };
  message?: string;
}

@Injectable()
export class AccountsService {
  private readonly accountsServiceUrl: string;
  private cachedMgmtToken: string | null = null;
  private mgmtTokenExpiry: number = 0;
  private readonly DOMAIN: string;

  constructor(
    private readonly config: ConfigService,
    private readonly proxy: ProxyService,
    private readonly http: HttpService,
    private readonly otpService: OtpService,
  ) {
    this.accountsServiceUrl = this.config.get<string>(
      'ACCOUNTS_SERVICE_URL',
      'http://localhost:3002',
    );
    this.DOMAIN = this.config.getOrThrow<string>('AUTH0_DOMAIN');
  }

  async login(dto: LoginDto): Promise<{
    access_token: string;
    expires_in: number;
    requiresOTP: boolean;
  }> {
    // check if user has verified thier email in auth0
    let user: Auth0UserResponse;
    try {
      const data = await this.getAuth0UserByEmail(dto.email);
      if (data && !data.email_verified) {
        throw new UnauthorizedException(
          'Email not verified. Please verify your email before logging in. (Note it may take time for the email to be marked as verified.)',
        );
      }
      user = data;
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

    //check if user account is active in accounts service
    try {
      const valid = await this.proxy.forward({
        url: `${this.accountsServiceUrl}/api/auth/is-active`,
        method: 'GET',
        data: {
          authID: user.user_id,
        },
      });
      if (!valid) {
        throw new UnauthorizedException(
          'Account is deactivated. Please contact support.',
        );
      }
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      } else {
        logger.warn('unable to see if account is active or not', err);
      }
    }

    //Actual login request with auth0
    try {
      logger.info('Sending login request to auth0', dto.email);
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
      logger.info('User ' + dto.email + ' has attempted to log in');
      //Check if use needs to send an otp
      let requiresOTP: boolean = false;
      if (dto.sendOTP) {
        if (!dto.deviceToken) {
          await this.otpService.generateAndSend(dto.email);
          requiresOTP = true;
        } else {
          if (
            !(await this.verifyDevice(
              dto.email,
              dto.deviceToken,
              data.access_token,
            ))
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
      if (axiosErr.response?.status == 500) {
        logger.error('Server error at login: ', err);
        throw err;
      }
      logger.error('Login error:', axiosErr.response?.data ?? axiosErr.message);
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  //Sends a request to accounts to verify device token
  private async verifyDevice(
    email: string,
    deviceToken: string,
    token: string,
  ): Promise<boolean> {
    try {
      const valid: boolean = await this.proxy.forward({
        url: `${this.accountsServiceUrl}/api/auth/device/verify`,
        method: 'POST',
        data: {
          email: email,
          deviceToken: deviceToken,
        },
        headers: { Authorization: token },
      });
      return valid;
    } catch {
      return false;
    }
  }

  private async getAuth0UserByEmail(email: string): Promise<Auth0UserResponse> {
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
}
