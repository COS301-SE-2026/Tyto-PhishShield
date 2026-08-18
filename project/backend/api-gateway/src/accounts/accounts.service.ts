import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProxyService } from "../proxy/proxy.service";
import { LoginDto } from "../dto/login.dto";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { OtpService } from "../otp/otp.service";
import { logger } from "../logger/logger.service";

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

    try {
      const valid = await this.proxy.forward(
        {
          url: `${this.accountsServiceUrl}/api/auth/is-active`,
          method: 'GET',
          data: {
            authID: user.user_id
          },
          
        }
      ) as boolean;
      if (!valid) {
        throw new UnauthorizedException(
          'Account is deactivated. Please contact support.',
        );
      }
    } catch (err: unknown) {
      if (!(err instanceof UnauthorizedException)) {
        logger.warn('unable to see if account is active or not', err);
      } else {
        throw err;
      }
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
            !(await this.verifyDevice(dto.email, dto.deviceToken, data.access_token))
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

  private async verifyDevice(email: string, deviceToken: string, token: string): Promise<boolean> {
    //TODO Send a request to accounts to verify device
    try {
      const valid = await this.proxy.forward(
        {
          url: `${this.accountsServiceUrl}/api/auth/device/verify`,
          method: 'POST',
          data: {
            email: email,
            deviceToken: deviceToken,
          },
          headers: { Authorization: token },
        }
      ) as boolean;
      return valid;
    } catch {
      return false;
    }
    // const user = await this.authService.getAuth0UserByEmail(email);

    // if (!user) {
    //   throw new UnauthorizedException('User not registered');
    // }

    // const hashedToken = crypto.hash('sha256', deviceToken);
    // const trustedDevice = await this.deviceRepo.findOne({
    //   where: {
    //     tokenHash: hashedToken,
    //     userId: user.user_id,
    //   },
    // });

    // if (!trustedDevice) return false;

    // trustedDevice.lastUsedAt = new Date();

    // if (new Date() > trustedDevice.expiresAt) return false;

    // await this.deviceRepo.update(trustedDevice.id, trustedDevice);
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