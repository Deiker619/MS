import { registerAs } from '@nestjs/config';

export interface MicroserviceRouteConfig {
  prefix: string;
  targetUrl: string;
  requiresAuth: boolean;
  requiresApiKey: boolean;
  timeoutMs?: number;
}

export const servicesConfig = registerAs('services', () => ({
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  logsServiceUrl: process.env.LOGS_SERVICE_URL,

  routes: [
    {
      prefix: 'auth',
      targetUrl: process.env.AUTH_SERVICE_URL,
      requiresAuth: false,
      requiresApiKey: false,
    },
    {
      prefix: 'logs',
      targetUrl: process.env.LOGS_SERVICE_URL,
      requiresAuth: true,
      requiresApiKey: false,
    },
  ] as MicroserviceRouteConfig[],
}));
