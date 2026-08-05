import { ConfigService } from '@nestjs/config';
import { RouteResolver } from './proxy.routes';

describe('Route resolver', () => {
    let resolver: RouteResolver;
    let config: { getOrThrow: jest.Mock }

    beforeEach(async () => {
        config = {
            getOrThrow: jest.fn((key: string) => {
                switch(key) {
                    case 'ACCOUNTS_SERVICE_URL': return 'accounts';
                    case 'EDUCATION_SERVICE_URL': return 'education';
                    case 'MAILING_SERVICE_URL': return 'mailing';
                    case 'REPORT_SERVICE_URL': return 'report';
                    case 'XP_SERVICE_URL': return 'xp';
                    case 'SERVER_DOMAIN': return 'domain';
                    default: throw Error('unexpected key');
                }
            })
        }

        resolver = new RouteResolver(config as unknown as ConfigService);
    });

    it('returns correct route and target service', () => {
        expect(resolver.resolve('/api/accounts/auth/login')).toEqual({
            apiRoute: '/api/accounts',
            targetService: 'accounts/api',
        });
    });

    it('gets rid of server domain before matching', () => {
        expect(resolver.resolve('https://domain/api/report/some/route')).toEqual({
            apiRoute: '/api/report',
            targetService: 'report',
        });
    });

    it('throws error for unknown route', () => {
        expect(() => resolver.resolve('/api/unknown')).toThrow(
            'Unknown route: /api/unknown',
        );
    });
});