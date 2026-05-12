import axios from 'axios';
import { config } from '../config/env';

interface MonnifyEnvelope<T = unknown> {
  requestSuccessful?: boolean;
  responseMessage?: string;
  responseCode?: string;
  responseBody?: T;
}

interface MonnifyLoginBody {
  accessToken: string;
  expiresIn: number;
}

export interface MonnifyInitTransactionBody {
  transactionReference: string;
  paymentReference: string;
  checkoutUrl?: string;
}

export interface MonnifyBankTransferBody {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  ussdCode?: string;
}

export interface MonnifyTransactionDetails {
  transactionReference: string;
  paymentReference: string;
  amountPaid: string;
  totalPayable?: string;
  paymentStatus: string;
  currency?: string;
  paymentDescription?: string;
  paymentMethod?: string;
}

const DEFAULT_DEVICE_INFORMATION = {
  httpBrowserLanguage: 'en-US',
  httpBrowserJavaEnabled: false,
  httpBrowserJavaScriptEnabled: true,
  httpBrowserColorDepth: 24,
  httpBrowserScreenHeight: 1203,
  httpBrowserScreenWidth: 2138,
  httpBrowserTimeDifference: '',
  userAgentBrowserValue:
    'Mozilla/5.0 (Bookmate Payment; Linux) AppleWebKit/537.36 (KHTML, like Gecko)',
};

export type MonnifyPaymentMethodKind = 'CARD' | 'ACCOUNT_TRANSFER' | 'USSD' | 'PHONE_NUMBER';

export class MonnifyService {
  private baseUrl: string;
  private token?: string;
  private tokenExpiryMs = 0;

  constructor() {
    this.baseUrl = config.monnify.baseUrl;
  }

  private ensureMonnifyCredentials(): void {
    if (!this.baseUrl) {
      throw new Error('Set MONNIFY_BASE_URL in your environment (.env).');
    }
    if (!config.monnify.apiKey || !config.monnify.secretKey) {
      throw new Error('Set MONNIFY_API_KEY and MONNIFY_SECRET_KEY in your environment (.env).');
    }
    if (!config.monnify.contractCode) {
      throw new Error('Set MONNIFY_CONTRACT_CODE in your environment (.env).');
    }
  }

  async getBearerToken(): Promise<string> {
    this.ensureMonnifyCredentials();
    const now = Date.now();
    if (this.token && now < this.tokenExpiryMs - 60_000) {
      return this.token;
    }

    const basic = Buffer.from(
      `${config.monnify.apiKey}:${config.monnify.secretKey}`,
      'utf8'
    ).toString('base64');

    const { data } = await axios.post<MonnifyEnvelope<MonnifyLoginBody>>(
      `${this.baseUrl}/api/v1/auth/login`,
      {},
      { headers: { Authorization: `Basic ${basic}` } }
    );

    if (!data.requestSuccessful || !data.responseBody?.accessToken) {
      throw new Error(data.responseMessage || 'Monnify authentication failed');
    }

    this.token = data.responseBody.accessToken;
    const ttlSec = data.responseBody.expiresIn || 3600;
    this.tokenExpiryMs = now + ttlSec * 1000;
    return this.token;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const bearer = await this.getBearerToken();
    return {
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
    };
  }

  private unwrap<T>(data: MonnifyEnvelope<T>, context: string): T {
    if (!data.requestSuccessful || data.responseCode !== '0' || data.responseBody == null) {
      throw new Error(data.responseMessage || context);
    }
    return data.responseBody;
  }

  async initTransaction(params: {
    amount: number;
    customerEmail: string;
    customerName?: string;
    paymentReference: string;
    paymentDescription: string;
    paymentMethods: MonnifyPaymentMethodKind[];
    metadata?: Record<string, string | number | boolean>;
    /** Full HTTPS redirect where Monnify sends the customer after checkout (mobile bridge page). */
    redirectUrl?: string;
  }): Promise<MonnifyInitTransactionBody> {
    const headers = await this.authHeaders();
    const { data } = await axios.post<MonnifyEnvelope<MonnifyInitTransactionBody>>(
      `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        amount: params.amount,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        paymentReference: params.paymentReference,
        paymentDescription: params.paymentDescription,
        currencyCode: 'NGN',
        contractCode: config.monnify.contractCode,
        redirectUrl: params.redirectUrl ?? config.monnify.returnUrl,
        paymentMethods: params.paymentMethods,
        metadata: params.metadata,
      },
      { headers }
    );
    return this.unwrap(data, 'Monnify init transaction failed');
  }

  async initBankTransferPayment(
    transactionReference: string,
    bankCode?: string
  ): Promise<MonnifyBankTransferBody> {
    const headers = await this.authHeaders();
    const { data } = await axios.post<MonnifyEnvelope<MonnifyBankTransferBody>>(
      `${this.baseUrl}/api/v1/merchant/bank-transfer/init-payment`,
      { transactionReference, ...(bankCode ? { bankCode } : {}) },
      { headers }
    );
    return this.unwrap(data, 'Monnify bank transfer init failed');
  }

  async chargeCard(params: {
    transactionReference: string;
    card: {
      number: string;
      expiryMonth: string;
      expiryYear: string;
      pin: string;
      cvv: string;
    };
    collectionChannel?: string;
  }): Promise<{
    status: string;
    message?: string;
    transactionReference?: string;
    paymentReference?: string;
  }> {
    const headers = await this.authHeaders();
    const { data } = await axios.post<
      MonnifyEnvelope<{
        status: string;
        message?: string;
        transactionReference?: string;
        paymentReference?: string;
      }>
    >(
      `${this.baseUrl}/api/v1/merchant/cards/charge`,
      {
        transactionReference: params.transactionReference,
        collectionChannel: params.collectionChannel || 'API_NOTIFICATION',
        card: {
          number: params.card.number,
          expiryMonth: params.card.expiryMonth,
          expiryYear: params.card.expiryYear,
          pin: params.card.pin,
          cvv: params.card.cvv,
        },
        deviceInformation: DEFAULT_DEVICE_INFORMATION,
      },
      { headers }
    );
    return this.unwrap(data, 'Monnify card charge failed');
  }

  async getTransactionStatus(paymentOrTransactionReference: string): Promise<MonnifyTransactionDetails> {
    const headers = await this.authHeaders();
    const isMonnifyTxnRef = paymentOrTransactionReference.includes('|');
    const query = isMonnifyTxnRef
      ? `transactionReference=${encodeURIComponent(paymentOrTransactionReference)}`
      : `paymentReference=${encodeURIComponent(paymentOrTransactionReference)}`;

    const { data } = await axios.get<MonnifyEnvelope<MonnifyTransactionDetails>>(
      `${this.baseUrl}/api/v2/merchant/transactions/query?${query}`,
      { headers }
    );
    return this.unwrap(data, 'Monnify transaction query failed');
  }
}
