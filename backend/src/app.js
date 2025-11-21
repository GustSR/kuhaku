import Fastify from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/user.js';

export function buildApp(opts = {}) {
  const app = Fastify(opts);

  app.register(cors, {
    origin: process.env.CORS_ORIGIN,
  });

  app.setErrorHandler(errorHandler);

  app.register(authRoutes, { prefix: '/auth' });
  app.register(userRoutes, { prefix: '/users' });

  app.get('/', async () => {
    return { message: 'Kuhaku Backend is running!' };
  });

  return app;
}
