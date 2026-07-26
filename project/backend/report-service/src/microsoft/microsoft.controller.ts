import {
  Controller,
  Post,
  Body,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { MicrosoftService } from './microsoft.service';
import type { MicrosoftUserInfo } from './microsoft.service';

@Controller('auth')
export class MicrosoftController {
  constructor(private readonly microsoftService: MicrosoftService) {}

  @Post('microsoft')
  @HttpCode(200)
  async exchange(@Body('token') token: string): Promise<MicrosoftUserInfo> {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    return this.microsoftService.exchangeToken(token);
  }
}
