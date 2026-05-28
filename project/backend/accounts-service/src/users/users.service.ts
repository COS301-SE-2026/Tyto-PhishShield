/**
 * UsersService — business logic for user management.
 *
 * - Handles CRUD operations against the user repository and performs user-related checks.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

interface CreateUserInput {
  auth0Id: string;
  email: string;
  name?: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  create(input: CreateUserInput): Promise<User> {
    const user = this.repo.create(input);
    return this.repo.save(user);
  }

  findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.repo.findOne({ where: { auth0Id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findAll(): Promise<User[]> {
    return this.repo.find();
  }

  async findById(id:string): Promise<User> {
    const user = await this.repo.findOne({ where: {id } });
    if (!user) {
      throw new NotFoundException('User ${id} not found');
    }
    return user;
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.repo.save(user);
  }

  async updateProfile(auth0Id: string, data: { name?: string; email?: string }): Promise<User> {
    const user = await this.repo.findOne({ where: { auth0Id } });
    if (!user) throw new NotFoundException('User not found');
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    return this.repo.save(user);

  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.repo.remove(user);
  }
}
