import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByRegNumber(regNumber: string): Promise<User | null> {
    return this.repository.findOne({ where: { regNumber } });
  }

  async findByEmailOrRegNumber(emailOrRegNumber: string): Promise<User | null> {
    // Check if it's an email format or regNumber (11 digits)
    const isEmail = emailOrRegNumber.includes('@');
    
    if (isEmail) {
      return this.findByEmail(emailOrRegNumber);
    } else {
      return this.findByRegNumber(emailOrRegNumber);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.repository.update(id, userData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }
}

