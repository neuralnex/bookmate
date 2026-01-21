import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';
import { User } from '../entities/User';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(userData: {
    name: string;
    email: string;
    regNumber: string;
    password: string;
    role?: 'student' | 'admin';
    accommodation?: string;
  }): Promise<{ user: User; token: string }> {
    // Check if user already exists by email
    const existingUserByEmail = await this.userRepository.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    // Check if user already exists by regNumber
    const existingUserByReg = await this.userRepository.findByRegNumber(userData.regNumber);
    if (existingUserByReg) {
      throw new Error('User with this registration number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'student',
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      token,
    };
  }

  async login(emailOrRegNumber: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email or regNumber
    const user = await this.userRepository.findByEmailOrRegNumber(emailOrRegNumber);
    if (!user) {
      throw new Error('Invalid email/registration number or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email/registration number or password');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      token,
    };
  }
}

