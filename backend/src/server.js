import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';

import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/user.js';
import { errorHandler } from './middlewares/errorHandler.js';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: process.env.CORS_ORIGIN,
});

fastify.setErrorHandler(errorHandler);

fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(userRoutes, { prefix: '/users' });

fastify.get('/', async () => {
  return { message: 'Kuhaku Backend is running!' };
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3333, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
