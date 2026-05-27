import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/response';
import { initiatePaymentSchema, verifyPaymentSchema } from '../utils/validators';
import { config } from '../config/env';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickQueryScalar(query: Request['query'], key: string): string | undefined {
  const raw = query[key];
  if (raw === undefined) return undefined;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === 'string' && v.length ? v : undefined;
}

function pickOrderId(req: Request): string | undefined {
  const paramId = req.params.orderId;
  if (typeof paramId === 'string' && paramId.length) {
    return paramId;
  }
  return pickQueryScalar(req.query, 'orderId');
}

function pickWebhookReference(body: Record<string, unknown>): string | undefined {
  const candidates = [
    body.paymentReference,
    body.reference,
    body.transactionReference,
    body.paymentRef,
    body.payRef,
    body.payment_reference,
    body.transaction_reference,
  ].filter((x) => typeof x === 'string' && String(x).length > 0) as string[];

  return candidates[0];
}

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
      const body = req.body as Record<string, unknown>;
      const reference = pickWebhookReference(body);

      if (!reference) {
        sendError(res, 'Missing payment or transaction reference in callback payload', 400);
        return;
      }

      await this.paymentService.syncPaymentFromMonnifyReference(reference);

      res.status(200).json({
        requestSuccessful: true,
        responseMessage: 'success',
        responseCode: '0',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Monnify redirects the browser here (HTTPS). This page immediately opens the native app via custom scheme + Expo Router.
   */
  handleMobileReturn = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const scheme = config.app.deepLinkScheme;
      const orderId = pickOrderId(req);

      if (!orderId || !UUID_RE.test(orderId)) {
        const msg = encodeURIComponent(
          orderId ? 'invalid_order_link' : 'missing_order_link'
        );
        const fallback = `${scheme}:///orders?deepLink_error=${msg}`;
        res
          .status(400)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .send(
            `<!DOCTYPE html><html><body style="font-family:system-ui;padding:24px;text-align:center">
            <p>Invalid payment return link.</p>
            <p><a href=${JSON.stringify(fallback)}>Open app</a></p></body></html>`
          );
        return;
      }

      const forward = new URLSearchParams();
      for (const [key, raw] of Object.entries(req.query)) {
        if (key === 'orderId') continue;
        if (raw === undefined) continue;
        const v = Array.isArray(raw) ? raw[0] : raw;
        if (typeof v === 'string' && v.length > 0) {
          forward.set(key, v);
        }
      }
      const qs = forward.toString();
      const deeplinkHost = `${scheme}:///orders/${encodeURIComponent(orderId)}/payment-confirm`;
      const deepLink = qs ? `${deeplinkHost}?${qs}` : deeplinkHost;

      const js = JSON.stringify(deepLink);
      const html =
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Bookmate — return to app</title>` +
        `<script>(function(){setTimeout(function(){location.replace(${js});},200);})();</script></head>` +
        `<body style="font-family:system-ui,sans-serif;text-align:center;padding:32px;line-height:1.5;color:#222">` +
        `<p>Opening the Bookmate app…</p>` +
        `<p><a href=${js} style="display:inline-block;padding:14px 20px;background:#111;color:#fff;text-decoration:none;border-radius:12px;font-weight:600">Open app</a></p>` +
        `<p style="font-size:14px;color:#666">If nothing happens, tap the button.</p>` +
        `</body></html>`;
      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
    } catch (error) {
      next(error);
    }
  };

  handleReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = req.query;

      if (!reference) {
        sendError(res, 'Missing payment reference', 400);
        return;
      }

      const paymentStatus = await this.paymentService.queryPaymentStatus(reference as string);

      sendSuccess(
        res,
        {
          reference,
          status: paymentStatus.status,
          amount: paymentStatus.amount,
          currency: paymentStatus.currency,
        },
        'Payment status retrieved'
      );
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
      sendSuccess(res, null, 'Payment cancelled locally');
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
      sendSuccess(res, result, 'Checkout payment initiated successfully');
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
