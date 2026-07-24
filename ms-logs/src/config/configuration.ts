export default () => ({
  port: parseInt(process.env.APP_PORT || '3002', 10),
  nats: {
    servers: (process.env.NATS_SERVERS || 'nats://localhost:4222').split(','),
  },
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'ms_logs_db',
  },
});
