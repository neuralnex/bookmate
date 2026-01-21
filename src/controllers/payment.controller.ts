import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/response';
import { initiatePaymentSchema, verifyPaymentSchema } from '../utils/validators';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const validatedData = initiatePaymentSchema.parse(req.body);
      const result = await this.paymentService.initiatePayment(
        validatedData.orderId,
        validatedData.payMethod,
        {
          bankcard: validatedData.bankcard,
          bankCode: validatedData.bankCode,
          bankAccountNumber: validatedData.bankAccountNumber,
          bvn: validatedData.bvn,
          dobDay: validatedData.dobDay,
          dobMonth: validatedData.dobMonth,
          dobYear: validatedData.dobYear,
          userPhone: validatedData.userPhone,
          customerName: validatedData.customerName,
        }
      );
      sendSuccess(res, result, 'Payment initiated successfully');
    } catch (error) {
      next(error);
    }
  };

  handleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // OPay callback format
      const { reference, orderNo, status } = req.body;

      if (!reference || !status) {
        sendError(res, 'Missing required callback parameters', 400);
        return;
      }

      await this.paymentService.handleCallback(reference, orderNo, status);
      
      // OPay expects 200 response
      res.status(200).json({ code: '00000', message: 'SUCCESSFUL' });
    } catch (error) {
      next(error);
    }
  };

  handleReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Handle return URL redirect after payment
      const { reference, status } = req.query;

      if (!reference) {
        sendError(res, 'Missing payment reference', 400);
        return;
      }

      // Query payment status
      const paymentStatus = await this.paymentService.queryPaymentStatus(reference as string);
      
      sendSuccess(res, {
        reference,
        status: paymentStatus.status,
        amount: paymentStatus.amount,
        currency: paymentStatus.currency,
      }, 'Payment status retrieved');
    } catch (error) {
      next(error);
    }
  };

  queryPaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.params;

      if (!reference) {
        sendError(res, 'Payment reference is required', 400);
        return;
      }

      const paymentStatus = await this.paymentService.queryPaymentStatus(reference);
      sendSuccess(res, paymentStatus, 'Payment status retrieved');
    } catch (error) {
      next(error);
    }
  };

  cancelPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.body;

      if (!reference) {
        sendError(res, 'Payment reference is required', 400);
        return;
      }

      await this.paymentService.cancelPayment(reference);
      sendSuccess(res, null, 'Payment cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  initiateCashierPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const { orderId } = req.body;
      if (!orderId) {
        sendError(res, 'Order ID is required', 400);
        return;
      }

      const result = await this.paymentService.initiateCashierPayment(orderId);
      sendSuccess(res, result, 'Cashier payment initiated successfully');
    } catch (error) {
      next(error);
    }
  };

  verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = verifyPaymentSchema.parse(req.body);
      await this.paymentService.verifyPayment(
        validatedData.orderId,
        validatedData.paymentReference,
        validatedData.status
      );
      sendSuccess(res, null, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  };
}
