import { GetUserUseCase } from '../../usecases/GetUser.js';
import { UserMockRepository } from '../../infra/repositories/UserMockRepository.js';

export class UserController {
  async getMe(request, reply) {
    const userId = request.user.id;

    const userRepository = new UserMockRepository();
    const getUserUseCase = new GetUserUseCase(userRepository);

    const user = await getUserUseCase.execute(userId);
    return reply.send(user);
  }
}
