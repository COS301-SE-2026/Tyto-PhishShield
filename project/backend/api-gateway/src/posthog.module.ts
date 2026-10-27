import { Global, Module } from '@nestjs/common';
import { PostHogService } from './posthog.service';

@Global()
@Module({
  providers: [PostHogService],
  exports: [PostHogService],
})
export class PostHogModule {}
