import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Route authentication requests to the Accounts Service
    if (req.path.startsWith('/api/auth')) {
      const target =
        process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3002';
      createProxyMiddleware({
        target,
        changeOrigin: true,
        on: {
          error: (err, _req, _res) => {
            console.error('Proxy error:', err.message);
          },
        },
      })(req, res, next);
    } else {
      // No match let the Gateway handle the request itself (e.g., Swagger)
      next();
    }
  }
}