import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    // Make email lookup case-insensitive by converting to lowercase
    return this.repository.findOne({ 
      where: { email: email.toLowerCase() } 
    });
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
    // Normalize email to lowercase to ensure case-insensitive lookups
    const normalizedData = { ...userData };
    if (normalizedData.email) {
      normalizedData.email = normalizedData.email.toLowerCase();
    }
    const user = this.repository.create(normalizedData);
    return this.repository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    // Normalize email to lowercase if being updated
    const normalizedData = { ...userData };
    if (normalizedData.email) {
      normalizedData.email = normalizedData.email.toLowerCase();
    }
    await this.repository.update(id, normalizedData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }
}

