/**
 * UsersService — business logic for user management.
 *
 * - Handles CRUD operations against the user repository and performs user-related checks.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { EventProducerService } from '../event-producer/event-producer.service';
import { Department } from './entities/user.entity';

export interface CreateUserInput {
  auth0Id: string;
  email: string;
  name?: string;
  role?: UserRole;
  department?: Department;
  isVerified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @Inject() private readonly event: EventProducerService,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const user = this.repo.create(input);
    const savedUser = await this.repo.save(user);   // save first

    // Fire-and-forget event with error logging
    this.event.publishUserCreatedEvent({
        id: savedUser.id,
        auth0Id: savedUser.auth0Id,
        name: savedUser.name,
        email: savedUser.email,
        department: input.department ?? '',
    }).catch((err) =>
        console.error('Failed to publish user.created event', err)
    );

    return savedUser;
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

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
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

  async updateProfile(
    auth0Id: string,
    data: { name?: string; email?: string; department?: Department },
  ): Promise<User> {
    const user = await this.repo.findOne({ where: { auth0Id } });
    if (!user) throw new NotFoundException('User not found');
    if (data.name !== undefined) user.name = data.name;
    if (data.department !== undefined) user.department = data.department;
    return this.repo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.repo.remove(user);
  }

  async removeByAuth0Id(auth0Id: string): Promise<void> {
    const user = await this.repo.findOne({ where: { auth0Id } });
    if (user) {
      await this.repo.remove(user);
    }
  }

  async markVerified(auth0Id: string): Promise<void> {
    await this.repo.update({ auth0Id }, { isVerified: true });
  }

  async deactivate(id: string): Promise<void> {
    await this.repo.update({ id }, { isActive: false });
  }
}
