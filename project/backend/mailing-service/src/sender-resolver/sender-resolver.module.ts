import { Module } from '@nestjs/common';
import { SenderResolverController } from './sender-resolver.controller';
import { SenderResolverService } from './sender-resolver.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { ConnectionEntity } from '../entities/connection.entity';
import { EmployeeInfoEntity } from '../entities/employee-info.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ConnectionEntity,
      EmployeeInfoEntity,
    ]),
  ],
  controllers: [SenderResolverController],
  providers: [SenderResolverService],
  exports: [SenderResolverService],
})
export class SenderResolverModule {}
