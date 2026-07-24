import * as joi from 'joi';

export const envSchema = joi.object({
  APP_PORT: joi.number().default(3000),
  TCP_PORT: joi.number().default(3001),

  DB_HOST: joi.string().required(),
  DB_PORT: joi.number().default(5432),
  DB_USER: joi.string().required(),
  DB_PASS: joi.string().required(),
  DB_NAME: joi.string().required(),

  REDIS_HOST: joi.string().default('localhost'),
  REDIS_PORT: joi.number().default(6379),

  JWT_ACCESS_SECRET: joi.string().required(),
  JWT_ACCESS_EXPIRES: joi.string().default('15m'),

  JWT_REFRESH_SECRET: joi.string().required(),
  JWT_REFRESH_EXPIRES: joi.string().default('7d'),

  APP_SECRET: joi.string().required(), // Used for AES-256 encryption (2FA secret)

  NATS_URL: joi.string().default('nats://localhost:4222'),
});
