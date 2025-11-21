import { LoginUseCase } from '../../usecases/Login.js';
import { UserMockRepository } from '../../infra/repositories/UserMockRepository.js';

export class AuthController {
  async login(request, reply) {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ message: 'Email and password are required' });
    }

    const userRepository = new UserMockRepository();
    const loginUseCase = new LoginUseCase(userRepository);

    const result = await loginUseCase.execute(email, password);
    return reply.send(result);
  }

  async validate(request, reply) {
    // A lógica de validação do token já está no middleware.
    // Se chegou aqui, o token é válido.
    return reply.send({ valid: true, userId: request.user.id });
  }
}
