import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { ReviewEntity } from '../entities/review.entity';
import { XpModule } from '../xp/xp.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ReviewEntity]), XpModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
