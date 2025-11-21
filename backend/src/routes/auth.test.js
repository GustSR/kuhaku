import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { buildApp } from '../app.js';

describe('Auth Routes Integration Test', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Constrói o app sem o logger para manter o output do teste limpo
    app = buildApp({ logger: false });
    await app.ready();
    server = app.server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login should return 200 and a token for valid credentials', async () => {
    const response = await supertest(server)
      .post('/auth/login')
      .send({
        email: 'admin@kuhaku.com',
        password: '123456',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('admin@kuhaku.com');
  });

  it('POST /auth/login should return 401 for invalid credentials', async () => {
    const response = await supertest(server)
      .post('/auth/login')
      .send({
        email: 'admin@kuhaku.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  it('POST /auth/login should return 400 if email is missing', async () => {
    const response = await supertest(server)
      .post('/auth/login')
      .send({
        password: '123456',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Email and password are required');
  });
});
