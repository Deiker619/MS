import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || '1',
  proxyTimeoutMs: parseInt(process.env.PROXY_TIMEOUT_MS || '10000', 10),
}));

export const securityConfig = registerAs('security', () => ({
  jwtSecret: process.env.JWT_SECRET,
  apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
  gatewayApiKey: process.env.GATEWAY_API_KEY || 'fintech-gateway-secret-key',
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));
