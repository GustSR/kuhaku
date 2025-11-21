import { UserController } from '../adapters/controllers/UserController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

export async function userRoutes(fastify) {
  const userController = new UserController();
  
  fastify.get('/me', { preHandler: [authMiddleware] }, userController.getMe);
}
