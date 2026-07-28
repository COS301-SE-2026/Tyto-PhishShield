/**
 * This file contains the list of routes used to redirect requests to the correct service
 * It also has a function which can be used to resolve the urls to the correct service
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProxyRoute {
    apiRoute: string;
    targetService: string;
}

@Injectable()
export class RouteResolver {
    private readonly PROXY_ROUTES: ProxyRoute[] = [
        {
            apiRoute: "/api/accounts",
            targetService: this.config.getOrThrow('ACCOUNTS_SERVICE_URL')+'/api',
        },
        {
            apiRoute: "/api/education",
            targetService: this.config.getOrThrow('EDUCATION_SERVICE_URL'),
        },
        {
            apiRoute: "/api/emails",
            targetService: this.config.getOrThrow('MAILING_SERVICE_URL'),
        },
        {
            apiRoute: "/api/batch-emails",
            targetService: this.config.getOrThrow('MAILING_SERVICE_URL'),
        },
        {
            apiRoute: "/api/report",
            targetService: this.config.getOrThrow('REPORT_SERVICE_URL'!),
        },
        {
            apiRoute: "/api/xp",
            targetService: this.config.getOrThrow('XP_SERVICE_URL'),
        },
        {
            apiRoute: "/api/xp-websocket",
            targetService: this.config.getOrThrow('XP_SERVICE_URL'),
        },
    ];
    private readonly expectedStart = 'https://' + this.config.getOrThrow<string>('SERVER_DOMAIN');
    constructor(
        private readonly config: ConfigService,
    ) {}

    resolve(path: string) : ProxyRoute {
        if (path.startsWith(this.expectedStart)) {
            path = path?.replace(this.expectedStart, "") || '';
        }
        for(const route of this.PROXY_ROUTES) {
            if (path.startsWith(route.apiRoute)) {
                return route;
            }
        }
        throw new Error('Unknown route: ' + path);
    }
}