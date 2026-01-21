import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OrderItem } from '../entities/OrderItem';

export class OrderItemRepository {
  private repository: Repository<OrderItem>;

  constructor() {
    this.repository = AppDataSource.getRepository(OrderItem);
  }

  async create(orderItemData: Partial<OrderItem>): Promise<OrderItem> {
    const orderItem = this.repository.create(orderItemData);
    return this.repository.save(orderItem);
  }

  async createMany(orderItemsData: Partial<OrderItem>[]): Promise<OrderItem[]> {
    const orderItems = this.repository.create(orderItemsData);
    return this.repository.save(orderItems);
  }
}

