import 'reflect-metadata';
import { initializeDatabase, AppDataSource } from '../src/config/database';
import { UserRepository } from '../src/repositories/user.repository';
import bcrypt from 'bcrypt';

const createAdmin = async (): Promise<void> => {
  try {
    // Get admin details from command line arguments or environment variables
    const name = process.argv[2] || process.env.ADMIN_NAME || 'Admin User';
    const email = process.argv[3] || process.env.ADMIN_EMAIL;
    const regNumber = process.argv[4] || process.env.ADMIN_REG_NUMBER;
    const password = process.argv[5] || process.env.ADMIN_PASSWORD;

    if (!email || !regNumber || !password) {
      console.log('Usage: npm run create-admin [name] [email] [regNumber] [password]');
      console.log('\nOr set environment variables:');
      console.log('  ADMIN_NAME=Admin User');
      console.log('  ADMIN_EMAIL=admin@example.com');
      console.log('  ADMIN_REG_NUMBER=20211258822');
      console.log('  ADMIN_PASSWORD=yourpassword');
      console.log('\nExample:');
      console.log('  npm run create-admin "Admin User" admin@bookmate.com 20211258822 admin123');
      process.exit(1);
    }

    console.log('=== Create Admin User ===\n');

    // Initialize database
    await initializeDatabase();
    console.log('Database connected\n');

    const userRepository = new UserRepository();

    // Validate regNumber
    if (regNumber.length !== 11 || !/^\d+$/.test(regNumber)) {
      console.error('Error: Registration number must be exactly 11 digits');
      process.exit(1);
    }

    // Check if user already exists
    const existingUserByEmail = await userRepository.findByEmail(email);
    if (existingUserByEmail) {
      console.error('Error: User with this email already exists');
      process.exit(1);
    }

    const existingUserByReg = await userRepository.findByRegNumber(regNumber);
    if (existingUserByReg) {
      console.error('Error: User with this registration number already exists');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await userRepository.create({
      name,
      email,
      regNumber,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('\nAdmin user created successfully!');
    console.log('\nAdmin Details:');
    console.log(`  ID: ${admin.id}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Registration Number: ${admin.regNumber}`);
    console.log(`  Role: ${admin.role}`);
    console.log('\nYou can now login with:');
    console.log(`  Email: ${email}`);
    console.log(`  OR Registration Number: ${regNumber}`);
    console.log(`  Password: ${password}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
};

createAdmin();

