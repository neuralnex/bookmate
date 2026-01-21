import { OrderService } from './order.service';
import { PaymentStatus } from '../entities/Order';
import { OPayService, OPayPaymentRequest, OPayPaymentMethod, OPayCashierRequest } from './opay.service';
import { config } from '../config/env';
import { UserRepository } from '../repositories/user.repository';

export class PaymentService {
  private orderService: OrderService;
  private opayService: OPayService;
  private userRepository: UserRepository;

  constructor() {
    this.orderService = new OrderService();
    this.opayService = new OPayService();
    this.userRepository = new UserRepository();
  }

  async initiatePayment(
    orderId: string,
    payMethod: OPayPaymentMethod,
    paymentData?: {
      bankcard?: {
        cardHolderName: string;
        cardNumber: string;
        cvv: string;
        expiryMonth: string;
        expiryYear: string;
      };
      bankCode?: string;
      bankAccountNumber?: string;
      bvn?: string;
      dobDay?: string;
      dobMonth?: string;
      dobYear?: string;
      userPhone?: string;
      customerName?: string;
    }
  ): Promise<{
    paymentReference: string;
    opayOrderNo?: string;
    redirectUrl?: string;
    transferAccount?: {
      accountNumber: string;
      bankName: string;
      expiredTimestamp: number;
    };
    ussd?: string;
    qrCode?: string;
    referenceCode?: string;
  }> {
    const order = await this.orderService.getOrderById(orderId);

    if (order.paymentStatus === 'paid') {
      throw new Error('Order already paid');
    }

    // Get user information
    const user = await this.userRepository.findById(order.studentId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate unique payment reference
    const paymentReference = `BOOKMATE-${Date.now()}-${orderId.substring(0, 8)}`;

    // Build product name from order items
    const productName = order.orderItems
      .map((item) => `${item.quantity}x ${item.book.title}`)
      .join(', ');

    // Prepare OPay payment request
    const opayRequest: OPayPaymentRequest = {
      reference: paymentReference,
      amount: {
        currency: 'NGN',
        total: Number(order.totalAmount), // Will be converted to cents in OPay service
      },
      product: {
        name: productName,
        description: `Book order #${order.id.substring(0, 8)}`,
      },
      payMethod,
      country: 'NG',
      callbackUrl: config.opay.callbackUrl,
      returnUrl: config.opay.returnUrl,
      expireAt: 30, // 30 minutes
    };

    // Add payment method specific data
    if (payMethod === 'BankCard' && paymentData?.bankcard) {
      opayRequest.bankcard = {
        ...paymentData.bankcard,
        enable3DS: true,
      };
    }

    if (payMethod === 'BankTransfer' || payMethod === 'BankUssd' || payMethod === 'BankAccount') {
      if (paymentData?.customerName) {
        opayRequest.customerName = paymentData.customerName;
      } else {
        opayRequest.customerName = user.name;
      }

      if (paymentData?.userPhone) {
        opayRequest.userPhone = paymentData.userPhone;
      }

      opayRequest.userInfo = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userMobile: paymentData?.userPhone,
      };
    }

    if (payMethod === 'BankUssd' && paymentData?.bankCode) {
      opayRequest.bankCode = paymentData.bankCode;
    }

    if (payMethod === 'BankAccount' && paymentData) {
      if (paymentData.bankAccountNumber) {
        opayRequest.bankAccountNumber = paymentData.bankAccountNumber;
      }
      if (paymentData.bankCode) {
        opayRequest.bankCode = paymentData.bankCode;
      }
      if (paymentData.bvn) {
        opayRequest.bvn = paymentData.bvn;
      }
      if (paymentData.dobDay && paymentData.dobMonth && paymentData.dobYear) {
        opayRequest.dobDay = paymentData.dobDay;
        opayRequest.dobMonth = paymentData.dobMonth;
        opayRequest.dobYear = paymentData.dobYear;
      }
    }

    if (payMethod === 'ReferenceCode') {
      opayRequest.merchantName = 'BOOKMATE';
      opayRequest.notify = {
        notifyUserName: user.name,
        notifyLanguage: 'English',
        notifyMethod: 'BOTH',
        notifyUserEmail: user.email,
        notifyUserMobile: paymentData?.userPhone || '',
      };
    }

    // Call OPay API
    const opayResponse = await this.opayService.createPayment(opayRequest);

    if (opayResponse.code !== '00000') {
      throw new Error(`OPay payment failed: ${opayResponse.message}`);
    }

    if (!opayResponse.data) {
      throw new Error('OPay payment response missing data');
    }

    // Update order with payment reference and OPay order number
    await this.orderService.updateOrder(orderId, {
      paymentReference: opayResponse.data.reference,
      opayOrderNo: opayResponse.data.orderNo,
    });

    // Prepare response based on payment method
    const response: any = {
      paymentReference: opayResponse.data.reference,
      opayOrderNo: opayResponse.data.orderNo,
    };

    if (opayResponse.data.nextAction) {
      if (opayResponse.data.nextAction.actionType === 'REDIRECT_3DS' && opayResponse.data.nextAction.redirectUrl) {
        response.redirectUrl = opayResponse.data.nextAction.redirectUrl;
      }

      if (opayResponse.data.nextAction.actionType === 'TRANSFER_ACCOUNT') {
        response.transferAccount = {
          accountNumber: opayResponse.data.nextAction.transferAccountNumber,
          bankName: opayResponse.data.nextAction.transferBankName,
          expiredTimestamp: opayResponse.data.nextAction.expiredTimestamp,
        };
      }

      if (opayResponse.data.nextAction.actionType === 'SHOW_USSD' && opayResponse.data.nextAction.ussd) {
        response.ussd = opayResponse.data.nextAction.ussd;
      }

      if (opayResponse.data.nextAction.actionType === 'SCAN_QR_CODE' && opayResponse.data.nextAction.qrCode) {
        response.qrCode = opayResponse.data.nextAction.qrCode;
      }
    }

    if (opayResponse.data.referenceCode) {
      response.referenceCode = opayResponse.data.referenceCode;
    }

    return response;
  }

  async handleCallback(reference: string, orderNo: string, status: string): Promise<void> {
    // Find order by payment reference
    const order = await this.orderService.getOrderByPaymentReference(reference);

    if (!order) {
      throw new Error('Order not found');
    }

    // Map OPay status to our payment status
    let paymentStatus: PaymentStatus = 'pending';
    if (status === 'SUCCESS') {
      paymentStatus = 'paid';
      await this.orderService.updatePaymentStatus(order.id, 'paid');
      await this.orderService.updateOrderStatus(order.id, 'purchased');
    } else if (status === 'FAIL' || status === 'CLOSE') {
      paymentStatus = 'failed';
      await this.orderService.updatePaymentStatus(order.id, 'failed');
    }

    // Update OPay order number if not set
    if (!order.opayOrderNo && orderNo) {
      await this.orderService.updateOrder(order.id, { opayOrderNo: orderNo });
    }
  }

  async queryPaymentStatus(reference: string): Promise<{
    status: string;
    amount: number;
    currency: string;
  }> {
    const opayResponse = await this.opayService.queryPaymentStatus(reference);

    if (opayResponse.code !== '00000') {
      throw new Error(`OPay query failed: ${opayResponse.message}`);
    }

    if (!opayResponse.data) {
      throw new Error('OPay response missing data');
    }

    return {
      status: opayResponse.data.status,
      amount: opayResponse.data.amount.total / 100, // Convert from cents to Naira
      currency: opayResponse.data.amount.currency,
    };
  }

  async cancelPayment(reference: string): Promise<void> {
    const opayResponse = await this.opayService.cancelPayment(reference);

    if (opayResponse.code !== '00000') {
      throw new Error(`OPay cancel failed: ${opayResponse.message}`);
    }

    // Update order status
    const order = await this.orderService.getOrderByPaymentReference(reference);
    if (order) {
      await this.orderService.updatePaymentStatus(order.id, 'failed');
    }
  }

  /**
   * Initiate OPay Cashier (Express Checkout) payment
   * Returns cashier URL for redirect
   */
  async initiateCashierPayment(orderId: string): Promise<{
    paymentReference: string;
    opayOrderNo?: string;
    cashierUrl: string;
  }> {
    const order = await this.orderService.getOrderById(orderId);

    if (order.paymentStatus === 'paid') {
      throw new Error('Order already paid');
    }

    // Get user information
    const user = await this.userRepository.findById(order.studentId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate unique payment reference
    const paymentReference = `BOOKMATE-${Date.now()}-${orderId.substring(0, 8)}`;

    // Build product name from order items
    const productName = order.orderItems
      .map((item) => `${item.quantity}x ${item.book.title}`)
      .join(', ');

    // Prepare OPay Cashier request
    const cashierRequest: OPayCashierRequest = {
      reference: paymentReference,
      amount: {
        currency: 'NGN',
        total: Number(order.totalAmount), // Will be converted to cents in OPay service
      },
      product: {
        name: productName,
        description: `Book order #${order.id.substring(0, 8)}`,
      },
      country: 'NG',
      callbackUrl: config.opay.callbackUrl,
      returnUrl: config.opay.returnUrl,
      expireAt: 30, // 30 minutes
      customerName: user.name,
      userInfo: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      },
    };

    // Call OPay Cashier API
    const opayResponse = await this.opayService.createCashierPayment(cashierRequest);

    if (opayResponse.code !== '00000') {
      throw new Error(`OPay payment failed: ${opayResponse.message}`);
    }

    if (!opayResponse.data || !opayResponse.data.cashierUrl) {
      throw new Error('OPay payment response missing cashier URL');
    }

    // Update order with payment reference and OPay order number
    await this.orderService.updateOrder(orderId, {
      paymentReference: opayResponse.data.reference,
      opayOrderNo: opayResponse.data.orderNo,
    });

    return {
      paymentReference: opayResponse.data.reference,
      opayOrderNo: opayResponse.data.orderNo,
      cashierUrl: opayResponse.data.cashierUrl,
    };
  }

  async verifyPayment(
    orderId: string,
    paymentReference: string,
    status: 'success' | 'failed'
  ): Promise<void> {
    // This method is kept for backward compatibility
    // In production, use handleCallback from webhook
    const order = await this.orderService.getOrderById(orderId);

    if (status === 'success') {
      await this.orderService.updatePaymentStatus(orderId, 'paid');
      await this.orderService.updateOrderStatus(orderId, 'purchased');
    } else {
      await this.orderService.updatePaymentStatus(orderId, 'failed');
    }
  }
}
