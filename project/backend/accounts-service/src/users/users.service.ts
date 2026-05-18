import { Injectable } from '@nestjs/common';
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
}
