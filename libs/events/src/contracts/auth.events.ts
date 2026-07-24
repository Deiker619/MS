import { BaseEventPayload } from './base.event';

// Specific payloads for Auth Events (Ensuring NO sensitive data like passwords or tokens are passed)
export interface UserRegisteredData {
  userId: string;
  email: string;
  roles?: string[];
  registeredAt: string;
}

export interface UserAuthenticatedData {
  userId: string;
  email: string;
  authMethod: 'password' | '2fa' | 'social';
  isTwoFactorPassed: boolean;
}

export interface UserLogoutData {
  userId: string;
  reason?: string;
}

export interface UserPasswordChangedData {
  userId: string;
  changedAt: string;
}

export interface UserPasswordResetData {
  userId: string;
  resetAt: string;
}

export interface User2faToggledData {
  userId: string;
  enabled: boolean;
}

export interface UserAccountLockedData {
  userId: string;
  reason: string;
  lockedAt: string;
}

export type UserRegisteredEvent = BaseEventPayload<UserRegisteredData>;
export type UserAuthenticatedEvent = BaseEventPayload<UserAuthenticatedData>;
export type UserLogoutEvent = BaseEventPayload<UserLogoutData>;
export type UserPasswordChangedEvent = BaseEventPayload<UserPasswordChangedData>;
export type UserPasswordResetEvent = BaseEventPayload<UserPasswordResetData>;
export type User2faToggledEvent = BaseEventPayload<User2faToggledData>;
export type UserAccountLockedEvent = BaseEventPayload<UserAccountLockedData>;
