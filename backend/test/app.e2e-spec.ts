import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/afisha');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/api/afisha/films (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/afisha/films')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(({ body }) => {
        expect(body.items).toEqual(expect.any(Array));
        expect(body.total).toBe(body.items.length);
      });
  });
});
