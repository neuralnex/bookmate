import { OrderService } from './order.service';
import {
  MonnifyService,
  MonnifyPaymentMethodKind,
  MonnifyInitTransactionBody,
  MonnifyTransactionDetails,
} from './monnify.service';
import { Order, PaymentStatus } from '../entities/Order';
import { UserRepository } from '../repositories/user.repository';
import { config } from '../config/env';

export type GatewayPayMethod =
  | 'BankCard'
  | 'BankTransfer'
  | 'BankUssd'
  | 'BankAccount'
  | 'ReferenceCode'
  | 'OpayWalletNgQR';

/** Legacy `payMethod` enum preserved for mobile/API compatibility; gateways use Monnify. */
export class PaymentService {
  private orderService: OrderService;
  private monnifyService: MonnifyService;
  private userRepository: UserRepository;

  constructor() {
    this.orderService = new OrderService();
    this.monnifyService = new MonnifyService();
    this.userRepository = new UserRepository();
  }

  private customerDisplayName(params: {
    customerName?: string;
    fallback: string;
  }): string {
    return params.customerName?.trim() || params.fallback;
  }

  /** HTTPS URL hit by Monnify after checkout; redirects into the Expo app (`APP_DEEP_LINK_SCHEME`). */
  private monnifyCheckoutReturnUrl(orderId: string): string {
    const base = config.app.publicWebOrigin;
    if (!base) {
      throw new Error(
        'Set PUBLIC_WEB_BASE_URL or a full MONNIFY_RETURN_URL so the mobile return bridge can be built'
      );
    }
    return `${base}/payments/mobile-return/${encodeURIComponent(orderId)}`;
  }

  private async persistTxnAndRespond(
    orderId: string,
    init: MonnifyInitTransactionBody,
    extras?: {
      redirectUrl?: string;
      transferAccount?: {
        accountNumber: string;
        bankName: string;
        expiredTimestamp?: number;
      };
      ussd?: string;
      checkoutUrl?: string;
    }
  ) {
    await this.orderService.updateOrder(orderId, {
      paymentReference: init.paymentReference,
      monnifyTransactionReference: init.transactionReference,
    });

    const url =
      extras?.checkoutUrl || init.checkoutUrl || extras?.redirectUrl;

    return {
      paymentReference: init.paymentReference,
      reference: init.paymentReference,
      monnifyTransactionReference: init.transactionReference,
      cashierUrl: url,
      paymentUrl: url,
      redirectUrl: extras?.redirectUrl,
      transferAccount: extras?.transferAccount,
      ussd: extras?.ussd,
    };
  }

  normalizeMonnifyStatus(raw: string | undefined): 'SUCCESS' | 'FAIL' | 'PENDING' {
    const s = (raw || '').toUpperCase();
    if (
      ['PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETE', 'COMPLETED', 'SETTLED'].some((x) =>
        s.includes(x)
      )
    ) {
      return 'SUCCESS';
    }
    if (
      ['FAIL', 'FAILED', 'CANCEL', 'CANCELLED', 'REVERSED', 'EXPIRED', 'ABANDONED'].some(
        (x) => s.includes(x)
      )
    ) {
      return 'FAIL';
    }
    return 'PENDING';
  }

  async initiatePayment(
    orderId: string,
    payMethod: GatewayPayMethod,
    paymentData?: {
      bankcard?: {
        cardHolderName: string;
        cardNumber: string;
        cvv: string;
        expiryMonth: string;
        expiryYear: string;
        pin?: string;
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
    reference: string;
    monnifyTransactionReference?: string;
    redirectUrl?: string;
    transferAccount?: {
      accountNumber: string;
      bankName: string;
      expiredTimestamp?: number;
    };
    ussd?: string;
    qrCode?: string;
    referenceCode?: string;
    cashierUrl?: string;
    paymentUrl?: string;
  }> {
    const order = await this.orderService.getOrderById(orderId);

    if (order.paymentStatus === 'paid') {
      throw new Error('Order already paid');
    }

    const user = await this.userRepository.findById(order.studentId);
    if (!user) {
      throw new Error('User not found');
    }

    const paymentReference = `BOOKMATE-${Date.now()}-${orderId.substring(0, 8)}`;
    const customerName = this.customerDisplayName({
      customerName: paymentData?.customerName,
      fallback: user.name,
    });

    const paymentDescription = `Book order #${order.id.substring(0, 8)}`;
    const amountNum = Number(order.totalAmount);

    const metadata: Record<string, string | number | boolean> = {
      bookmateOrderId: orderId,
    };
    if (paymentData?.userPhone) {
      metadata.customerPhone = paymentData.userPhone;
    }
    if (paymentData?.bankAccountNumber) {
      metadata.bankAccountHint = paymentData.bankAccountNumber.slice(-4);
    }

    const allChannels: MonnifyPaymentMethodKind[] = [
      'CARD',
      'ACCOUNT_TRANSFER',
      'USSD',
      'PHONE_NUMBER',
    ];

    if (payMethod === 'ReferenceCode' || payMethod === 'OpayWalletNgQR') {
      const init = await this.monnifyService.initTransaction({
        amount: amountNum,
        customerEmail: user.email,
        customerName,
        paymentReference,
        paymentDescription,
        paymentMethods: allChannels,
        metadata,
        redirectUrl: this.monnifyCheckoutReturnUrl(orderId),
      });
      const url = init.checkoutUrl;
      return this.persistTxnAndRespond(orderId, init, {
        checkoutUrl: url,
        redirectUrl: url,
      });
    }

    if (
      payMethod === 'BankTransfer' ||
      payMethod === 'BankUssd' ||
      payMethod === 'BankAccount'
    ) {
      const methods: MonnifyPaymentMethodKind[] =
        payMethod === 'BankUssd' ? ['USSD'] : ['ACCOUNT_TRANSFER'];
      const init = await this.monnifyService.initTransaction({
        amount: amountNum,
        customerEmail: user.email,
        customerName,
        paymentReference,
        paymentDescription,
        paymentMethods: methods,
        metadata,
        redirectUrl: this.monnifyCheckoutReturnUrl(orderId),
      });

      const bank = await this.monnifyService.initBankTransferPayment(
        init.transactionReference,
        paymentData?.bankCode
      );

      return this.persistTxnAndRespond(orderId, init, {
        transferAccount: {
          accountNumber: bank.accountNumber,
          bankName: bank.bankName,
          expiredTimestamp: Math.floor(Date.now() / 1000) + 30 * 60,
        },
        ussd: bank.ussdCode,
      });
    }

    if (payMethod === 'BankCard' && paymentData?.bankcard) {
      let expiryYear = paymentData.bankcard.expiryYear;
      if (
        expiryYear.length === 2 &&
        !expiryYear.includes('/') &&
        !expiryYear.includes('-')
      ) {
        expiryYear = `20${expiryYear}`;
      }

      const init = await this.monnifyService.initTransaction({
        amount: amountNum,
        customerEmail: user.email,
        customerName,
        paymentReference,
        paymentDescription,
        paymentMethods: ['CARD'],
        metadata,
        redirectUrl: this.monnifyCheckoutReturnUrl(orderId),
      });

      const cardPin =
        paymentData.bankcard.pin && paymentData.bankcard.pin.length >= 4
          ? paymentData.bankcard.pin
          : '1234';

      const charge = await this.monnifyService.chargeCard({
        transactionReference: init.transactionReference,
        card: {
          number: paymentData.bankcard.cardNumber.replace(/\s/g, ''),
          expiryMonth: paymentData.bankcard.expiryMonth.padStart(2, '0'),
          expiryYear,
          cvv: paymentData.bankcard.cvv,
          pin: cardPin,
        },
      });

      await this.orderService.updateOrder(orderId, {
        paymentReference: init.paymentReference,
        monnifyTransactionReference:
          charge.transactionReference || init.transactionReference,
      });

      const statusUpper = (charge.status || '').toUpperCase();
      const success =
        statusUpper.includes('SUCCESS') ||
        !!charge.message?.toLowerCase().includes('success');
      if (success) {
        await this.orderService.updatePaymentStatus(order.id, 'paid');
        await this.orderService.updateOrderStatus(order.id, 'purchased');
        await this.orderService.decrementStockForOrder(order.id);
      }

      return this.persistTxnAndRespond(orderId, init, {});
    }

    const init = await this.monnifyService.initTransaction({
      amount: amountNum,
      customerEmail: user.email,
      customerName,
      paymentReference,
      paymentDescription,
      paymentMethods: allChannels,
      metadata,
      redirectUrl: this.monnifyCheckoutReturnUrl(orderId),
    });
    const url = init.checkoutUrl;
    return this.persistTxnAndRespond(orderId, init, {
      checkoutUrl: url,
      redirectUrl: url,
    });
  }

  /**
   * Reconcile order payment status from Monnify using merchant payment reference
   * or Monnify transaction reference (both work with GET .../merchant/transactions/query).
   */
  async syncPaymentFromMonnifyReference(reference: string): Promise<void> {
    console.log(`Syncing payment from Monnify for reference: ${reference}`);

    let details: MonnifyTransactionDetails;

    try {
      details = await this.monnifyService.getTransactionStatus(reference);
      console.log(`Monnify transaction details for ${reference}:`, details);
    } catch (monnifyError) {
      console.error(`Failed to get transaction from Monnify for ${reference}:`, monnifyError);
      const order = await this.getOrderByPaymentReference(reference);
      if (!order) {
        throw new Error(`Order not found for payment reference: ${reference}`);
      }
      if (order.paymentStatus === 'paid') {
        console.log(`Order ${order.id} already marked as paid, skipping sync`);
        return;
      }
      const errorMessage = monnifyError instanceof Error ? monnifyError.message : String(monnifyError);
      throw new Error(`Monnify API error and order not found: ${errorMessage}`);
    }

    let order: Order;
    try {
      order = await this.getOrderByPaymentReference(details.paymentReference);
    } catch (orderError) {
      try {
        order = await this.getOrderByMonnifyTransactionReference(
          details.transactionReference
        );
      } catch (monnifyOrderError) {
        throw new Error(
          `Order not found for paymentReference ${details.paymentReference} or transactionReference ${details.transactionReference}`
        );
      }
    }

    console.log(`Found order ${order.id} for payment reference ${details.paymentReference}`);

    if (order.monnifyTransactionReference !== details.transactionReference) {
      await this.orderService.updateOrder(order.id, {
        monnifyTransactionReference: details.transactionReference,
      });
    }

    if (order.paymentStatus === 'paid') {
      console.log(`Order ${order.id} already marked as paid`);
      return;
    }

    const normalized = this.normalizeMonnifyStatus(details.paymentStatus);
    console.log(`Normalized status for ${reference}: ${normalized}`);

    if (normalized === 'SUCCESS') {
      console.log(`Updating order ${order.id} to PAID status`);
      await this.orderService.updatePaymentStatus(order.id, 'paid');
      await this.orderService.updateOrderStatus(order.id, 'purchased');
      await this.orderService.decrementStockForOrder(order.id);
      console.log(`Order ${order.id} marked as paid, stock decremented`);
    } else if (normalized === 'FAIL') {
      console.log(`Updating order ${order.id} to FAILED status`);
      await this.orderService.updatePaymentStatus(order.id, 'failed');
    } else {
      console.log(`Payment status still PENDING for order ${order.id}`);
    }
  }

  async queryPaymentStatus(reference: string): Promise<{
    status: PaymentStatus | string;
    amount: number;
    currency: string;
  }> {
    const details = await this.monnifyService.getTransactionStatus(reference);
    const norm = this.normalizeMonnifyStatus(details.paymentStatus);

    let paymentUi: PaymentStatus | string = 'pending';
    if (norm === 'SUCCESS') paymentUi = 'paid';
    else if (norm === 'FAIL') paymentUi = 'failed';

    // Sync the payment status to the order in database
    try {
      await this.syncPaymentFromMonnifyReference(reference);
    } catch (syncError) {
      console.error(`Failed to sync payment status for reference ${reference}:`, syncError);
      // Continue and return the status anyway - the sync might succeed later
    }

    return {
      status: paymentUi,
      amount: Number.parseFloat(String(details.amountPaid || '0')) || 0,
      currency: details.currency || 'NGN',
    };
  }

  async cancelPayment(reference: string): Promise<void> {
    const order = await this.getOrderByPaymentReference(reference);
    if (order) {
      await this.orderService.updatePaymentStatus(order.id, 'failed');
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    return this.orderService.getOrderById(orderId);
  }

  async getOrderByPaymentReference(paymentReference: string): Promise<Order> {
    const order = await this.orderService.getOrderByPaymentReference(paymentReference);
    if (!order) {
      throw new Error('Order not found for payment reference');
    }
    return order;
  }

  async getOrderByMonnifyTransactionReference(
    monnifyTransactionReference: string
  ): Promise<Order> {
    const order = await this.orderService.getOrderByMonnifyTransactionReference(
      monnifyTransactionReference
    );
    if (!order) {
      throw new Error('Order not found for Monnify transaction reference');
    }
    return order;
  }

  async initiateCashierPayment(orderId: string): Promise<{
    paymentReference: string;
    reference: string;
    monnifyTransactionReference: string;
    cashierUrl: string;
    paymentUrl: string;
  }> {
    const order = await this.orderService.getOrderById(orderId);

    if (order.paymentStatus === 'paid') {
      throw new Error('Order already paid');
    }

    const user = await this.userRepository.findById(order.studentId);
    if (!user) {
      throw new Error('User not found');
    }

    const paymentReference = `BOOKMATE-${Date.now()}-${orderId.substring(0, 8)}`;
    const paymentDescription = `Book order #${order.id.substring(0, 8)}`;
    const amountNum = Number(order.totalAmount);

    const init = await this.monnifyService.initTransaction({
      amount: amountNum,
      customerEmail: user.email,
      customerName: user.name,
      paymentReference,
      paymentDescription,
      paymentMethods: [
        'CARD',
        'ACCOUNT_TRANSFER',
        'USSD',
        'PHONE_NUMBER',
      ],
      metadata: { bookmateOrderId: orderId },
      redirectUrl: this.monnifyCheckoutReturnUrl(orderId),
    });

    const checkoutUrl = init.checkoutUrl;
    if (!checkoutUrl) {
      throw new Error('Monnify did not return a checkout URL');
    }

    await this.orderService.updateOrder(orderId, {
      paymentReference: init.paymentReference,
      monnifyTransactionReference: init.transactionReference,
    });

    return {
      paymentReference: init.paymentReference,
      reference: init.paymentReference,
      monnifyTransactionReference: init.transactionReference,
      cashierUrl: checkoutUrl,
      paymentUrl: checkoutUrl,
    };
  }

  async verifyPayment(
    orderId: string,
    _paymentReference: string,
    status: 'success' | 'failed'
  ): Promise<void> {
    const order = await this.orderService.getOrderById(orderId);

    if (order.paymentStatus === 'paid') {
      return;
    }

    if (status === 'success') {
      await this.orderService.updatePaymentStatus(orderId, 'paid');
      await this.orderService.updateOrderStatus(orderId, 'purchased');
      await this.orderService.decrementStockForOrder(orderId);
    } else {
      await this.orderService.updatePaymentStatus(orderId, 'failed');
    }
  }
}
