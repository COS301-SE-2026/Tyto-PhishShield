import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger/logger.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: typeof logger;
    }
  }
}

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const incomingRequestId =
    request.header('x-request-id') &&
    request.header('x-request-id')?.trim() !== ''
      ? request.header('x-request-id')?.trim() || randomUUID()
      : randomUUID();
  request.requestId = incomingRequestId;
  request.logger = logger.child({ requestId: incomingRequestId });
  response.setHeader('x-request-id', incomingRequestId);

  next();
}
