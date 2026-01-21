import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from './Order';

export type UserRole = 'student' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 11, unique: true })
  regNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({
    type: 'enum',
    enum: ['student', 'admin'],
    default: 'student',
  })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  accommodation?: string; // Full accommodation address

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Order, (order) => order.student)
  orders!: Order[];
}

