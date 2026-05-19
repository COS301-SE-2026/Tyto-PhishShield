import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneratedEmail } from '../entities/generated-emails.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GeneratedEmail])],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
