import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { OrderItem } from './OrderItem';

export type PaymentStatus = 'paid' | 'pending' | 'failed';
export type OrderStatus = 'processing' | 'purchased' | 'delivering' | 'delivered';
export type DeliveryMethod = 'pickup' | 'delivery';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student!: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee!: number;

  @Column({
    type: 'enum',
    enum: ['paid', 'pending', 'failed'],
    default: 'pending',
  })
  paymentStatus!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: ['processing', 'purchased', 'delivering', 'delivered'],
    default: 'processing',
  })
  orderStatus!: OrderStatus;

  @Column({
    type: 'enum',
    enum: ['pickup', 'delivery'],
    default: 'pickup',
  })
  deliveryMethod!: DeliveryMethod;

  @Column({ type: 'text' })
  deliveryAddress!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentReference?: string; // OPay payment reference

  @Column({ type: 'varchar', length: 255, nullable: true })
  opayOrderNo?: string; // OPay order number

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  orderItems!: OrderItem[];
}

