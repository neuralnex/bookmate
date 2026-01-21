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

export type BookCategory = 'Textbook' | 'Manual' | 'Guide' | 'Past Paper';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  author!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({
    type: 'enum',
    enum: ['Textbook', 'Manual', 'Guide', 'Past Paper'],
  })
  category!: BookCategory;

  @Column({ type: 'varchar', length: 50, nullable: true })
  classFormLevel?: string;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ type: 'text', nullable: true })
  coverImage?: string; // Base64 encoded image

  @Column({ type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.book)
  orderItems!: OrderItem[];
}

