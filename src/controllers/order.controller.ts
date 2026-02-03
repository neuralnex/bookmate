import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess, sendError } from '../utils/response';
import { createOrderSchema, updateOrderStatusSchema } from '../utils/validators';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const validatedData = createOrderSchema.parse(req.body);
      const order = await this.orderService.createOrder({
        studentId: req.user.userId,
        ...validatedData,
      });
      sendSuccess(res, order, 'Order created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const orders = await this.orderService.getOrdersByStudent(req.user.userId);
      sendSuccess(res, orders, 'Orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await this.orderService.getOrderById(id);

      // Check if user owns the order or is admin
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      if (req.user.userId !== order.studentId && req.user.role !== 'admin') {
        sendError(res, 'Unauthorized to view this order', 403);
        return;
      }

      sendSuccess(res, order, 'Order retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await this.orderService.getAllOrders();
      sendSuccess(res, orders, 'All orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = updateOrderStatusSchema.parse(req.body);
      const order = await this.orderService.updateOrderStatus(id, validatedData.orderStatus);
      sendSuccess(res, order, 'Order status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const order = await this.orderService.cancelOrder(id, userId);
      sendSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  };
}

