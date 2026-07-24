import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Gateway (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health/liveness (GET) should return ok liveness status', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/liveness')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.headers['x-correlation-id']).toBeDefined();
        expect(res.headers['x-request-id']).toBeDefined();
      });
  });

  it('protected route /api/v1/logs should return 401 Unauthorized without JWT token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/logs')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toBe(401);
        expect(res.body.correlationId).toBeDefined();
      });
  });
});
