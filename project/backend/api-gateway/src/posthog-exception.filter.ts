import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { PostHogService } from './posthog.service';

@Catch()
export class PostHogExceptionFilter extends BaseExceptionFilter {
  constructor(
    private readonly posthog: PostHogService,
    applicationRef: HttpAdapterHost,
  ) {
    super(applicationRef.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const isServerError =
      !(exception instanceof HttpException) || exception.getStatus() >= 500;

    if (isServerError && exception instanceof Error) {
      this.posthog.client?.captureException(exception);
    }

    super.catch(exception, host);
  }
}
