import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { EmailStatusModule } from './email-status/email-status.module';

// Please also add the EmailStatusEntity to the TypeOrmModule.forFeature()
@Module({
  imports: [AccountsModule, EmailStatusModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
