import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config/env';

export type OPayPaymentMethod = 
  | 'BankCard' 
  | 'BankTransfer' 
  | 'BankUssd' 
  | 'BankAccount' 
  | 'ReferenceCode' 
  | 'OpayWalletNgQR';

export interface OPayPaymentRequest {
  reference: string;
  amount: {
    currency: string;
    total: number; // in cents
  };
  product: {
    name: string;
    description: string;
  };
  payMethod: OPayPaymentMethod;
  country: string;
  callbackUrl?: string;
  returnUrl?: string;
  expireAt?: number;
  // BankCard specific
  bankcard?: {
    cardHolderName: string;
    cardNumber: string;
    cvv: string;
    enable3DS: boolean;
    expiryMonth: string;
    expiryYear: string;
  };
  // BankTransfer specific
  customerName?: string;
  userPhone?: string;
  userInfo?: {
    userId?: string;
    userName?: string;
    userMobile?: string;
    userEmail?: string;
  };
  // BankUssd specific
  bankCode?: string;
  // BankAccount specific
  bankAccountNumber?: string;
  bvn?: string;
  dobDay?: string;
  dobMonth?: string;
  dobYear?: string;
  // ReferenceCode specific
  merchantName?: string;
  notify?: {
    notifyUserName: string;
    notifyLanguage: string;
    notifyMethod?: string;
    notifyUserEmail?: string;
    notifyUserMobile?: string;
  };
}

export interface OPayPaymentResponse {
  code: string;
  message: string;
  data?: {
    reference: string;
    orderNo: string;
    status: string;
    amount: {
      total: number;
      currency: string;
    };
    nextAction?: {
      actionType: string;
      redirectUrl?: string;
      transferAccountNumber?: string;
      transferBankName?: string;
      expiredTimestamp?: number;
      ussd?: string;
      qrCode?: string;
    };
    referenceCode?: string;
    cashierUrl?: string; // For Cashier payments
    failureCode?: string;
    failureReason?: string;
  };
}

// OPay Cashier (Express Checkout) Request
export interface OPayCashierRequest {
  reference: string;
  amount: {
    currency: string;
    total: number; // in cents
  };
  product: {
    name: string;
    description: string;
  };
  country: string;
  callbackUrl?: string;
  returnUrl: string;
  expireAt?: number;
  userInfo?: {
    userId?: string;
    userName?: string;
    userMobile?: string;
    userEmail?: string;
  };
  customerName?: string;
  userPhone?: string;
}

export class OPayService {
  private merchantId: string;
  private publicKey: string; // For payment creation
  private secretKey: string; // For signature-based APIs
  private baseUrl: string;

  constructor() {
    this.merchantId = config.opay.merchantId;
    this.publicKey = config.opay.publicKey;
    this.secretKey = config.opay.secretKey;
    this.baseUrl = config.opay.baseUrl;
  }

  /**
   * Generate SHA-512 HMAC signature for OPay API authentication
   */
  private generateSignature(data: string): string {
    return crypto.createHmac('sha512', this.secretKey).update(data).digest('hex');
  }

  /**
   * Create OPay Cashier (Express Checkout) payment
   * Uses Public Key Authentication
   * Returns cashier URL for redirect
   */
  async createCashierPayment(request: OPayCashierRequest): Promise<OPayPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/international/cashier/create`;
    
    // Convert amount from Naira to cents
    const amountInCents = Math.round(request.amount.total * 100);
    const paymentData = {
      ...request,
      amount: {
        ...request.amount,
        total: amountInCents,
      },
    };

    // Use Public Key for payment creation
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.publicKey}`,
      'MerchantId': this.merchantId,
    };

    try {
      const response = await axios.post(url, paymentData, { headers });
      return response.data as OPayPaymentResponse;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as OPayPaymentResponse;
      }
      throw new Error(`OPay API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create payment request to OPay (Server-to-Server)
   * Uses Public Key Authentication (not signature)
   */
  async createPayment(request: OPayPaymentRequest): Promise<OPayPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/international/payment/create`;
    
    // Convert amount from Naira to cents
    const amountInCents = Math.round(request.amount.total * 100);
    const paymentData = {
      ...request,
      amount: {
        ...request.amount,
        total: amountInCents,
      },
    };

    // Use Public Key for payment creation (not signature)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.publicKey}`,
      'MerchantId': this.merchantId,
    };

    try {
      const response = await axios.post(url, paymentData, { headers });
      return response.data as OPayPaymentResponse;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as OPayPaymentResponse;
      }
      throw new Error(`OPay API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query payment status
   */
  async queryPaymentStatus(reference: string, country: string = 'NG'): Promise<OPayPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/international/cashier/status`;
    
    const data = { reference, country };
    const jsonData = JSON.stringify(data);
    const signature = this.generateSignature(jsonData);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signature}`,
      'MerchantId': this.merchantId,
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data as OPayPaymentResponse;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as OPayPaymentResponse;
      }
      throw new Error(`OPay API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(reference: string, country: string = 'NG'): Promise<OPayPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/international/payment/close`;
    
    const data = { reference, country };
    const jsonData = JSON.stringify(data);
    const signature = this.generateSignature(jsonData);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signature}`,
      'MerchantId': this.merchantId,
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data as OPayPaymentResponse;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as OPayPaymentResponse;
      }
      throw new Error(`OPay API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    reference: string,
    originalReference: string,
    amount: number,
    refundWay: 'Original' | 'BankAccount' = 'Original',
    country: string = 'NG',
    callbackUrl?: string,
    receiver?: {
      bankCode?: string;
      bankAccountNo?: string;
    }
  ): Promise<OPayPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/international/payment/refund/create`;
    
    const amountInCents = Math.round(amount * 100);
    const data: any = {
      reference,
      originalReference,
      country,
      refundWay,
      amount: {
        currency: 'NGN',
        total: amountInCents,
      },
    };

    if (callbackUrl) {
      data.callbackUrl = callbackUrl;
    }

    if (receiver) {
      data.receiver = receiver;
    }

    const jsonData = JSON.stringify(data);
    const signature = this.generateSignature(jsonData);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signature}`,
      'MerchantId': this.merchantId,
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data as OPayPaymentResponse;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as OPayPaymentResponse;
      }
      throw new Error(`OPay API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query refund status
   */
  async queryRefundStatus(reference: string, country: string = 'NG'): Promise<OPayPaymentResponse> {
    const url = `${this.baseUrl}/api/v1/international/payment/refund/query`;
    
    const data = { reference, country };
    const jsonData = JSON.stringify(data);
    const signature = this.generateSignature(jsonData);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signature}`,
      'MerchantId': this.merchantId,
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data as OPayPaymentResponse;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as OPayPaymentResponse;
      }
      throw new Error(`OPay API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

