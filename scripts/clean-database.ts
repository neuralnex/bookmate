import 'reflect-metadata';
import { AppDataSource, initializeDatabase } from '../src/config/database';
import { OrderItem } from '../src/entities/OrderItem';
import { Order } from '../src/entities/Order';
import { Book } from '../src/entities/Book';
import { User } from '../src/entities/User';

const cleanDatabase = async () => {
  try {
    await initializeDatabase();
    console.log('Database connected\n');

    const orderItemRepo = AppDataSource.getRepository(OrderItem);
    const orderRepo = AppDataSource.getRepository(Order);
    const bookRepo = AppDataSource.getRepository(Book);
    const userRepo = AppDataSource.getRepository(User);

    console.log('Cleaning database...\n');

    // Delete in order to respect foreign key constraints
    console.log('1. Deleting OrderItems...');
    const orderItemsCount = await orderItemRepo.count();
    if (orderItemsCount > 0) {
      await orderItemRepo.createQueryBuilder().delete().execute();
    }
    console.log(`   Deleted ${orderItemsCount} order items`);

    console.log('2. Deleting Orders...');
    const ordersCount = await orderRepo.count();
    if (ordersCount > 0) {
      await orderRepo.createQueryBuilder().delete().execute();
    }
    console.log(`   Deleted ${ordersCount} orders`);

    console.log('3. Deleting Books...');
    const booksCount = await bookRepo.count();
    if (booksCount > 0) {
      await bookRepo.createQueryBuilder().delete().execute();
    }
    console.log(`   Deleted ${booksCount} books`);

    console.log('4. Deleting Users (students only, keeping admins)...');
    const studentsCount = await userRepo.count({ where: { role: 'student' } });
    if (studentsCount > 0) {
      await userRepo.delete({ role: 'student' });
    }
    console.log(`   Deleted ${studentsCount} students`);

    const adminCount = await userRepo.count({ where: { role: 'admin' } });
    console.log(`   Info: Kept ${adminCount} admin user(s)\n`);

    console.log('Database cleaned successfully!');
    console.log('\nRemaining data:');
    console.log(`  - Admin users: ${adminCount}`);
    console.log(`  - Books: 0`);
    console.log(`  - Orders: 0`);
    console.log(`  - OrderItems: 0`);

  } catch (error) {
    console.error('\nError cleaning database:', error);
    if (error instanceof Error) {
      console.error('  Message:', error.message);
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

cleanDatabase();

