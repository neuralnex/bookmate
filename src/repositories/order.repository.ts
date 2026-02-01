import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';

export class OrderRepository {
  private repository: Repository<Order>;

  constructor() {
    this.repository = AppDataSource.getRepository(Order);
  }

  async findAll(): Promise<Order[]> {
    return this.repository.find({
      relations: ['student', 'orderItems', 'orderItems.book'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudentId(studentId: string): Promise<Order[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['orderItems', 'orderItems.book'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['student', 'orderItems', 'orderItems.book'],
    });
  }

  async findByPaymentReference(paymentReference: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { paymentReference },
      relations: ['student', 'orderItems', 'orderItems.book'],
    });
  }

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = this.repository.create(orderData);
    return this.repository.save(order);
  }

  async update(id: string, orderData: Partial<Order>): Promise<Order> {
    await this.repository.update(id, orderData);
    const updatedOrder = await this.findById(id);
    if (!updatedOrder) {
      throw new Error('Order not found');
    }
    return updatedOrder;
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new Error('Order not found');
    }
  }
}

