import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LoginUseCase } from './Login.js';
import { User } from '../domain/User.js';

// Mock do repositório para isolar o teste
const mockUserRepository = {
  findByEmail: jest.fn(),
};

describe('LoginUseCase', () => {
  let loginUseCase;

  beforeEach(() => {
    // Reseta os mocks antes de cada teste
    jest.clearAllMocks();
    loginUseCase = new LoginUseCase(mockUserRepository);
  });

  it('should authenticate a user and return a token and user data', async () => {
    const user = new User({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    mockUserRepository.findByEmail.mockResolvedValue(user);

    const result = await loginUseCase.execute('test@example.com', 'password123');

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
    expect(result.user.email).toBe('test@example.com');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should throw an error for invalid credentials (user not found)', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUseCase.execute('wrong@example.com', 'password123')).rejects.toThrow(
      'Invalid credentials'
    );
  });

  it('should throw an error for invalid credentials (wrong password)', async () => {
    const user = new User({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    mockUserRepository.findByEmail.mockResolvedValue(user);

    await expect(loginUseCase.execute('test@example.com', 'wrongpassword')).rejects.toThrow(
      'Invalid credentials'
    );
  });
});
