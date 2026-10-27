import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { DigestService } from './digest.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('auth/digest')
export class DigestController {
  constructor(
    private readonly digestService: DigestService,
    private readonly usersService: UsersService,
  ) {}

  @Post('send-now')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async sendNow(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findByAuth0Id(req.user.auth0Id);
    if (!user) throw new NotFoundException('User not found');
    await this.digestService.sendDigestToUser(user);
    return { message: 'Digest email sent' };
  }
}
