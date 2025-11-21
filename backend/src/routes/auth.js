import { AuthController } from '../adapters/controllers/AuthController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export async function authRoutes(fastify) {
  const authController = new AuthController();

  fastify.post('/login', authController.login);
  fastify.get('/validate', { preHandler: [authMiddleware] }, authController.validate);
}
