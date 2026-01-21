import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate OPay payment for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - payMethod
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               payMethod:
 *                 type: string
 *                 enum: [BankCard, BankTransfer, BankUssd, BankAccount, ReferenceCode, OpayWalletNgQR]
 *                 description: Payment method
 *               bankcard:
 *                 type: object
 *                 description: Required for BankCard payment
 *                 properties:
 *                   cardHolderName:
 *                     type: string
 *                   cardNumber:
 *                     type: string
 *                   cvv:
 *                     type: string
 *                   expiryMonth:
 *                     type: string
 *                   expiryYear:
 *                     type: string
 *               bankCode:
 *                 type: string
 *                 description: Required for BankUssd and BankAccount
 *               bankAccountNumber:
 *                 type: string
 *                 description: Required for BankAccount
 *               bvn:
 *                 type: string
 *                 description: Required for BankAccount
 *               dobDay:
 *                 type: string
 *                 description: Required for BankAccount
 *               dobMonth:
 *                 type: string
 *                 description: Required for BankAccount
 *               dobYear:
 *                 type: string
 *                 description: Required for BankAccount
 *               userPhone:
 *                 type: string
 *                 description: Customer phone number
 *               customerName:
 *                 type: string
 *                 description: Customer name
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *       400:
 *         description: Order already paid or invalid order
 */
/**
 * @swagger
 * /payments/initiate-cashier:
 *   post:
 *     summary: Initiate OPay Cashier (Express Checkout) payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a payment and returns a cashier URL. Redirect user to cashierUrl to complete payment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Cashier payment initiated successfully. Returns cashierUrl for redirect.
 *       400:
 *         description: Order already paid or invalid order
 */
router.post('/initiate-cashier', authMiddleware, paymentController.initiateCashierPayment);

router.post('/initiate', authMiddleware, paymentController.initiatePayment);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify payment (Payment gateway callback)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentReference
 *               - status
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               paymentReference:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid payment data
 */
/**
 * @swagger
 * /payments/callback:
 *   post:
 *     summary: OPay payment callback/webhook
 *     tags: [Payments]
 *     description: This endpoint receives callbacks from OPay when payment status changes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reference:
 *                 type: string
 *               orderNo:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [INITIAL, PENDING, SUCCESS, FAIL, CLOSE]
 *     responses:
 *       200:
 *         description: Callback processed successfully
 */
router.post('/callback', paymentController.handleCallback);

/**
 * @swagger
 * /payments/return:
 *   get:
 *     summary: Handle payment return URL redirect
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/return', paymentController.handleReturn);

/**
 * @swagger
 * /payments/status/{reference}:
 *   get:
 *     summary: Query payment status
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/status/:reference', paymentController.queryPaymentStatus);

/**
 * @swagger
 * /payments/cancel:
 *   post:
 *     summary: Cancel a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference
 *             properties:
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 */
router.post('/cancel', authMiddleware, paymentController.cancelPayment);

router.post('/verify', paymentController.verifyPayment);

export default router;

