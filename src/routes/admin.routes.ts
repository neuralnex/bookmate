import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();
const orderController = new OrderController();

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders with pagination and filtering (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [processing, purchased, delivering, delivered]
 *         description: Filter by order status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [paid, pending, failed]
 *         description: Filter by payment status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, totalAmount]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Paginated list of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All orders retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     total:
 *                       type: integer
 *                       example: 500
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 25
 *       403:
 *         description: Admin access required
 */
router.get('/orders', authMiddleware, adminMiddleware, orderController.getAllOrdersPaginated);

// Keep old endpoint for backward compatibility
router.get('/orders/all', authMiddleware, adminMiddleware, orderController.getAllOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderStatus
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [processing, purchased, delivering, delivered]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/orders/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin stats retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       example: 100
 *                     totalRevenue:
 *                       type: number
 *                       example: 500000
 *                     totalBooksSold:
 *                       type: integer
 *                       example: 500
 *                     ordersByStatus:
 *                       type: object
 *                       example: {"processing": 10, "purchased": 20, "delivering": 30, "delivered": 40}
 *                     ordersByPaymentStatus:
 *                       type: object
 *                       example: {"paid": 70, "pending": 20, "failed": 10}
 *                     dailyRevenue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2024-01-15"
 *                           revenue:
 *                             type: number
 *                             example: 50000
 *                     topSellingBooks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookId:
 *                             type: string
 *                           title:
 *                             type: string
 *                           author:
 *                             type: string
 *                           quantity:
 *                             type: integer
 *       403:
 *         description: Admin access required
 */
router.get('/stats', authMiddleware, adminMiddleware, orderController.getAdminStats);

export default router;

