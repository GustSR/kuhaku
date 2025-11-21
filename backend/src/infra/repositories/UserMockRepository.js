import { promises as fs } from 'fs';
import path from 'path';
import { User } from '../../domain/User.js';

const __dirname = path.resolve(path.dirname(''));
const mockDataPath = path.join(__dirname, 'src', 'mocks', 'users.json');

export class UserMockRepository {
  async #readData() {
    const data = await fs.readFile(mockDataPath, 'utf-8');
    return JSON.parse(data);
  }

  async findByEmail(email) {
    const users = await this.#readData();
    const user = users.find((u) => u.email === email);
    return user ? new User(user) : null;
  }

  async findById(id) {
    const users = await this.#readData();
    const user = users.find((u) => u.id === id);
    return user ? new User(user) : null;
  }
}
