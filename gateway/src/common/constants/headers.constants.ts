export const HTTP_HEADERS = {
  CORRELATION_ID: 'x-correlation-id',
  REQUEST_ID: 'x-request-id',
  API_KEY: 'x-api-key',
  USER_ID: 'x-user-id',
  USER_ROLES: 'x-user-roles',
  USER_EMAIL: 'x-user-email',
} as const;

export const METADATA_KEYS = {
  IS_PUBLIC: 'isPublic',
  REQUIRE_API_KEY: 'requireApiKey',
} as const;
