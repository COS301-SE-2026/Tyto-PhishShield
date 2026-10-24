import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';
import { Observable } from 'rxjs';
import type { GatewayUser } from './auth/strategies/jwt.strategy';

@Injectable()
export class PostHogService implements OnApplicationShutdown {
  readonly client?: PostHog;

  constructor(config: ConfigService) {
    const projectToken = config.get<string>('POSTHOG_PROJECT_TOKEN');
    const host = config.get<string>('POSTHOG_HOST');

    if (!projectToken || !host) {
      if (process.env.NODE_ENV !== 'production') {
        const missingVariable = projectToken
          ? 'POSTHOG_HOST'
          : 'POSTHOG_PROJECT_TOKEN';
        throw new Error(
          `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
        );
      }

      return;
    }

    this.client = new PostHog(projectToken, {
      host,
      enableExceptionAutocapture: true,
    });
  }

  async onApplicationShutdown() {
    await this.client?.shutdown();
  }
}

@Injectable()
export class PostHogUserContextInterceptor implements NestInterceptor {
  constructor(private readonly posthog: PostHogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: GatewayUser }>();

    return new Observable((subscriber) => {
      const proceed = () => next.handle().subscribe(subscriber);
      const distinctId = request.user?.auth0Id;

      if (!distinctId || !this.posthog.client) {
        return proceed();
      }

      return this.posthog.client.withContext({ distinctId }, proceed);
    });
  }
}
