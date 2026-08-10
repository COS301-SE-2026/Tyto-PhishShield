import {
  Controller,
  Get,
  Req,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { GatewayUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
    user: GatewayUser;
}

function authHeader(req: Request): Record<string, string> {
    const token = req.headers['authorization'];
    return token ? { Authorization: token } : {};
}

