export const AUTH_SUBJECTS = {
  USER_REGISTERED: 'auth.user.registered',
  USER_AUTHENTICATED: 'auth.user.authenticated',
  USER_LOGOUT: 'auth.user.logout',
  PASSWORD_CHANGED: 'auth.user.password.changed',
  PASSWORD_RESET: 'auth.user.password.reset',
  TWO_FACTOR_ENABLED: 'auth.user.2fa.enabled',
  TWO_FACTOR_DISABLED: 'auth.user.2fa.disabled',
  ACCOUNT_LOCKED: 'auth.user.account.locked',
  ACCOUNT_UNLOCKED: 'auth.user.account.unlocked',
} as const;

export type AuthSubject = typeof AUTH_SUBJECTS[keyof typeof AUTH_SUBJECTS];

export const WALLET_SUBJECTS = {
  CREATED: 'wallet.account.created',
  UPDATED: 'wallet.account.updated',
} as const;

export const PAYMENT_SUBJECTS = {
  INITIATED: 'payment.transaction.initiated',
  COMPLETED: 'payment.transaction.completed',
  FAILED: 'payment.transaction.failed',
} as const;

export const NOTIFICATION_SUBJECTS = {
  EMAIL_DISPATCHED: 'notification.email.dispatched',
  SMS_DISPATCHED: 'notification.sms.dispatched',
} as const;

export const NATS_STREAMS = {
  AUTH_EVENTS: {
    name: 'AUTH_EVENTS',
    subjects: ['auth.user.>'],
  },
  WALLET_EVENTS: {
    name: 'WALLET_EVENTS',
    subjects: ['wallet.account.>'],
  },
  PAYMENT_EVENTS: {
    name: 'PAYMENT_EVENTS',
    subjects: ['payment.transaction.>'],
  },
} as const;
