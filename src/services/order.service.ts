import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/orderItem.repository';
import { BookRepository } from '../repositories/book.repository';
import { DeliveryMethod, Order, OrderStatus, PaymentStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

// Flat delivery fee for Eziobodo deliveries (in Naira)
// Adjust this value as needed without changing business logic.
const EZIODOBO_DELIVERY_FEE = 500;

export class OrderService {
  private orderRepository: OrderRepository;
  private orderItemRepository: OrderItemRepository;
  private bookRepository: BookRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.orderItemRepository = new OrderItemRepository();
    this.bookRepository = new BookRepository();
  }

  async createOrder(orderData: {
    studentId: string;
    items: Array<{ bookId: string; quantity: number }>;
    deliveryAddress: string;
    deliveryMethod: DeliveryMethod;
  }): Promise<Order> {
    // Verify all books exist and check stock
    const bookIds = orderData.items.map((item) => item.bookId);
    const books = await this.bookRepository.findByIds(bookIds);

    if (books.length !== bookIds.length) {
      throw new Error('One or more books not found');
    }

    // Calculate total and verify stock
    let totalAmount = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of orderData.items) {
      const book = books.find((b) => b.id === item.bookId);
      if (!book) {
        throw new Error(`Book ${item.bookId} not found`);
      }

      if (book.stock < item.quantity) {
        throw new Error(`Insufficient stock for book: ${book.title}`);
      }

      const itemTotal = Number(book.price) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        bookId: book.id,
        quantity: item.quantity,
        price: Number(book.price),
      });
    }

    // Apply delivery fee for Eziobodo delivery
    const deliveryFee =
      orderData.deliveryMethod === 'delivery' ? EZIODOBO_DELIVERY_FEE : 0;
    totalAmount += deliveryFee;

    // Create order
    const order = await this.orderRepository.create({
      studentId: orderData.studentId,
      totalAmount,
      paymentStatus: 'pending',
      orderStatus: 'processing',
      deliveryAddress: orderData.deliveryAddress,
      deliveryMethod: orderData.deliveryMethod,
      deliveryFee,
    });

    // Create order items
    const savedOrderItems = await this.orderItemRepository.createMany(
      orderItems.map((item) => ({
        ...item,
        orderId: order.id,
      }))
    );

    // Update order with items
    order.orderItems = savedOrderItems;

    return order;
  }

  async getOrdersByStudent(studentId: string): Promise<Order[]> {
    return this.orderRepository.findByStudentId(studentId);
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async updateOrderStatus(
    id: string,
    orderStatus: OrderStatus
  ): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    return this.orderRepository.update(id, { orderStatus });
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus
  ): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    return this.orderRepository.update(id, { paymentStatus });
  }

  async decrementStockForOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    for (const item of order.orderItems) {
      await this.bookRepository.decrementStock(item.bookId, item.quantity);
    }
  }

  async getOrderByPaymentReference(paymentReference: string): Promise<Order> {
    const order = await this.orderRepository.findByPaymentReference(paymentReference);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    return this.orderRepository.update(id, orderData);
  }

  async cancelOrder(orderId: string, studentId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if order belongs to the student
    if (order.studentId !== studentId) {
      throw new Error('Unauthorized to cancel this order');
    }

    // Check if order can be cancelled
    // Can only cancel if payment is pending/failed and order is not delivered
    if (order.orderStatus === 'delivered') {
      throw new Error('Cannot cancel a delivered order');
    }

    if (order.paymentStatus === 'paid' && order.orderStatus !== 'processing') {
      throw new Error('Cannot cancel an order that has been paid and is being processed');
    }

    // If payment was pending/failed and order was processing, restore stock
    if (order.orderStatus === 'processing' || order.orderStatus === 'purchased') {
      // Restore stock for all items in the order
      for (const item of order.orderItems) {
        const book = await this.bookRepository.findById(item.bookId);
        if (book) {
          await this.bookRepository.update(item.bookId, {
            stock: book.stock + item.quantity,
          });
        }
      }
    }

    // Delete the order (or mark as cancelled - depending on your preference)
    await this.orderRepository.delete(orderId);
    
    // Return the order before deletion for response
    return order;
  }
}

