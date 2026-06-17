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

  async findAllPaginated(
    page: number = 1,
    limit: number = 20,
    options: {
      studentId?: string;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      sortBy?: 'createdAt' | 'totalAmount';
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ orders: Order[]; total: number }> {
    const { studentId, status, paymentStatus, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    
    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.student', 'student')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.book', 'book')
      .where('order.id IS NOT NULL');

    // Filter by student (for user's own orders)
    if (studentId) {
      queryBuilder.andWhere('order.studentId = :studentId', { studentId });
    }

    // Filter by order status
    if (status) {
      queryBuilder.andWhere('order.orderStatus = :status', { status });
    }

    // Filter by payment status
    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    // Sort
    const validSortColumns: Record<string, string> = {
      createdAt: 'order.createdAt',
      totalAmount: 'order.totalAmount',
    };
    const sortField = validSortColumns[sortBy] || 'order.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);

    // Pagination
    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
  }

  async findByStudentId(studentId: string): Promise<Order[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['orderItems', 'orderItems.book'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStudentIdPaginated(
    studentId: string,
    page: number = 1,
    limit: number = 20,
    options: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      sortBy?: 'createdAt' | 'totalAmount';
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ orders: Order[]; total: number }> {
    const { status, paymentStatus, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    
    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.book', 'book')
      .where('order.studentId = :studentId', { studentId });

    // Filter by order status
    if (status) {
      queryBuilder.andWhere('order.orderStatus = :status', { status });
    }

    // Filter by payment status
    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    // Sort
    const validSortColumns: Record<string, string> = {
      createdAt: 'order.createdAt',
      totalAmount: 'order.totalAmount',
    };
    const sortField = validSortColumns[sortBy] || 'order.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);

    // Pagination
    const [orders, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { orders, total };
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

  async findByPaymentReference(paymentReference: string): Promise<Order | null> {
    return this.repository.findOne({
      where: { paymentReference },
      relations: ['student', 'orderItems', 'orderItems.book'],
    });
  }

  async findByMonnifyTransactionReference(
    monnifyTransactionReference: string
  ): Promise<Order | null> {
    return this.repository.findOne({
      where: { monnifyTransactionReference },
      relations: ['student', 'orderItems', 'orderItems.book'],
    });
  }
}

