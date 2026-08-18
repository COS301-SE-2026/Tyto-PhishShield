/**
 * Controller: UsersController
 * Base path: /api/users
 *
 * Exposes user management endpoints protected by JWT authentication.
 * Role‑based access is enforced with {@link RolesGuard} and {@link Roles} decorators.
 *
 * Endpoints:
 * - {@link UsersController#findAll} – (admin, analyst) returns every user
 * - {@link UsersController#findOne} – returns a user by ID; regular users can only see themselves
 * - {@link UsersController#updateRole} – (admin) changes a user's role
 * - {@link UsersController#remove} – (admin) soft‑deletes a user (sets isActive = false)
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateRoleDto } from '../auth/dto/update-role.dto';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UpdateActiveDto } from '../auth/dto/update-active.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(id);
    if (
      (req.user.role as UserRole) === UserRole.USER &&
      user.auth0Id !== req.user.auth0Id
    ) {
      return { message: 'Not Allowed' };
    }
    return user;
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const user = await this.usersService.findById(id);
    await this.authService.updateAuth0UserRole(user.auth0Id, [dto.role]);
    return this.usersService.updateRole(id, dto.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    await this.authService.deleteUser(user.auth0Id);
    await this.usersService.remove(id);
  }

  @Patch(':id/active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateActive(
    @Param('id') id: string,
    @Body() dto: UpdateActiveDto,
  ) {
    const user = await this.usersService.findById(id);
  
    if (dto.isActive) {
      await this.authService.unblockUser(user.auth0Id);
      await this.usersService.activate(id);
    } else {
      await this.authService.blockUser(user.auth0Id);
      await this.usersService.deactivate(id);
    }
  
    return { message: dto.isActive ? 'User activated' : 'User deactivated' };
  }
}
