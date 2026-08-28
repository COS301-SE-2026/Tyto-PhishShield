import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Import } from './entities/import.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Import]),
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
