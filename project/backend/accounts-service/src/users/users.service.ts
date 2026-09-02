/**
 * Service: UsersService
 *
 * Manages user entities – creation, lookups, profile updates,
 * role changes, verification, and soft deletion.
 * Publishes a {@link EventUser} event after a new user is created.
 *
 * Methods:
 * - {@link UsersService#create} – persists a new user and fires a user.created event
 * - {@link UsersService#findByAuth0Id} – looks up a user by their Auth0 ID
 * - {@link UsersService#findByEmail} – looks up a user by email
 * - {@link UsersService#findAll} – returns every user in the system
 * - {@link UsersService#findById} – finds a user by internal UUID (throws 404 if missing)
 * - {@link UsersService#updateRole} – changes a user's role
 * - {@link UsersService#updateProfile} – updates name, email, and/or department
 * - {@link UsersService#remove} – hard‑deletes a user by ID
 * - {@link UsersService#removeByAuth0Id} – hard‑deletes a user by Auth0 ID
 * - {@link UsersService#markVerified} – sets isVerified = true
 * - {@link UsersService#deactivate} – sets isActive = false (soft delete)
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { EventProducerService } from '../event-producer/event-producer.service';
import { Department, UserRole } from '@phishshield/dto';

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
    const savedUser = await this.repo.save(user); // save first

    // Fire-and-forget event with error logging
    this.event
      .publishUserCreatedEvent({
        id: savedUser.id,
        auth0Id: savedUser.auth0Id,
        name: savedUser.name,
        email: savedUser.email,
        department: input.department ?? '',
      })
      .catch((err) =>
        console.error('Failed to publish user.created event', err),
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
    const saved = await this.repo.save(user);

    this.event
      .publishUserUpdatedEvent({
        id: saved.id,
        auth0Id: saved.auth0Id,
        name: saved.name,
        email: saved.email,
        department: saved.department,
      })
      .catch((err) =>
        console.error('Failed to publish user.updated event', err),
      );

    return saved;
  }

  async updateProfile(
    auth0Id: string,
    data: { name?: string; email?: string; department?: Department },
  ): Promise<User> {
    const user = await this.repo.findOne({ where: { auth0Id } });
    if (!user) throw new NotFoundException('User not found');
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.department !== undefined) user.department = data.department;

    const saved = await this.repo.save(user);
    this.event
      .publishUserUpdatedEvent({
        id: saved.id,
        auth0Id: saved.auth0Id,
        name: saved.name,
        email: saved.email,
        department: saved.department,
      })
      .catch((err) =>
        console.error('Failed to publish user.updated event', err),
      );

    return saved;
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

  async activate(id: string): Promise<void> {
    await this.repo.update({ id }, { isActive: true });
  }
}
