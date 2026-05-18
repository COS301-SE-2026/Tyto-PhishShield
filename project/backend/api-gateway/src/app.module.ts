import {
  Module,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ProxyMiddleware } from './proxy/proxy.middleware';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AccountsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProxyMiddleware).forRoutes('*');
  }
}
