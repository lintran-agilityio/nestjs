import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import type { Server } from 'http';

import { HealthModule } from '../../src/modules/health/health.module';
import { configureApp, url } from '@e2e/helpers/app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    server = app.getHttpServer() as unknown as Server;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET)', () => {
    return request(server).get(url('health')).expect(200);
  });
});
