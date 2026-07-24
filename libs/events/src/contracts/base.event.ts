export interface BaseEventPayload<T = any> {
  eventId: string;        // Unique identifier (UUID v4) for idempotency
  eventType: string;      // Subject / Event name (e.g. 'auth.user.authenticated')
  timestamp: string;      // ISO8601 string
  producer: string;       // Originating service name (e.g. 'ms-auth')
  correlationId?: string; // Tracing / Request Correlation ID
  userId?: string;        // Target User ID if applicable
  application?: string;   // Client application identifier
  ip?: string;            // Client IP address
  userAgent?: string;     // Client User Agent
  data: T;                // Event domain payload
  metadata?: Record<string, any>;
}
