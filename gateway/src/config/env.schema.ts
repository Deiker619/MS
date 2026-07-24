import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('1'),

  // Security
  JWT_SECRET: Joi.string().required(),
  API_KEY_HEADER: Joi.string().default('x-api-key'),
  GATEWAY_API_KEY: Joi.string().optional().default('fintech-gateway-secret-key'),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60000), // 60 seconds
  THROTTLE_LIMIT: Joi.number().default(100), // 100 requests per TTL

  // Microservices Routes
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  LOGS_SERVICE_URL: Joi.string().uri().required(),

  // Proxy Settings
  PROXY_TIMEOUT_MS: Joi.number().default(10000),
});
