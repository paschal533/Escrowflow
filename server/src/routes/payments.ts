import express, { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Job } from '../models/Job.js';
import { creditHeldFunds } from '../services/ledger.js';

// Fail at startup if the webhook secret is not configured — never fall back to empty string.
const WEBHOOK_SECRET = process.env.NOMBA_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  throw new Error('NOMBA_WEBHOOK_SECRET env var is required');
}

const router = Router();

// Real Nomba webhook shape — confirmed against https://developer.nomba.com/docs/api-basics/webhook
// (the previous implementation guessed at eventType/accountReference/amount and was never
// compatible with what Nomba actually sends).
export interface NombaWebhookPayload {
  event_type: string;
  requestId: string;
  data: {
    merchant: { userId: string; walletId: string; walletBalance?: number };
    transaction: {
      transactionId: string;
      type: string;
      time: string;
      responseCode?: string | null;
      transactionAmount: number;
      aliasAccountReference?: string;
      aliasAccountNumber?: string;
      aliasAccountType?: string;
    };
    customer?: { senderName?: string; bankCode?: string; accountNumber?: string };
  };
}

// Nomba's canonical signing string has a mandated field order — see the doc link above.
// A literal "null" responseCode (as opposed to it being absent) is normalised to ''.
export function buildNombaSignedString(payload: NombaWebhookPayload, timestamp: string): string {
  const { merchant, transaction } = payload.data;
  const responseCode =
    !transaction.responseCode || transaction.responseCode === 'null' ? '' : transaction.responseCode;
  return [
    payload.event_type,
    payload.requestId,
    merchant.userId,
    merchant.walletId,
    transaction.transactionId,
    transaction.type,
    transaction.time,
    responseCode,
    timestamp,
  ].join(':');
}

export function verifyNombaSignature(
  payload: NombaWebhookPayload,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(buildNombaSignedString(payload, timestamp))
    .digest('base64');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
}

// POST /payments/webhook
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawBody = req.body as Buffer;
      const signature = req.headers['nomba-signature'] as string | undefined;
      const timestamp = req.headers['nomba-timestamp'] as string | undefined;

      let payload: NombaWebhookPayload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        res.status(400).json({ error: 'Invalid JSON payload' });
        return;
      }

      if (
        !payload?.event_type ||
        !payload.requestId ||
        !payload.data?.merchant?.userId ||
        !payload.data?.transaction?.transactionId
      ) {
        res.status(400).json({ error: 'Missing required webhook fields' });
        return;
      }

      if (!signature || !timestamp || !verifyNombaSignature(payload, timestamp, signature, WEBHOOK_SECRET)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const eventId = payload.data.transaction.transactionId;

      // Idempotency — any existing record (even unprocessed) short-circuits
      const existing = await WebhookEvent.findOne({ eventId });
      if (existing) {
        res.json({ received: true, duplicate: true });
        return;
      }

      // Record event before processing (upsert so duplicate delivery before processing is safe)
      await WebhookEvent.findOneAndUpdate(
        { eventId },
        { eventId, eventType: payload.event_type, payload, processed: false },
        { upsert: true }
      );

      if (payload.event_type === 'payment_success') {
        const accountReference = payload.data.transaction.aliasAccountReference ?? '';

        if (!accountReference.startsWith('job-')) {
          console.error('[Webhook] Unrecognised accountReference:', accountReference);
          res.json({ received: true });
          return;
        }
        const jobId = accountReference.slice(4); // 'job-'.length === 4

        // Nomba sends amount in naira; convert to kobo for storage
        const rawAmount = Number(payload.data.transaction.transactionAmount);
        if (!rawAmount || rawAmount <= 0) {
          console.error('[Webhook] Invalid amount in payload:', payload.data.transaction.transactionAmount);
          res.status(400).json({ error: 'Invalid amount' });
          return;
        }
        const amountKobo = Math.round(rawAmount * 100);

        const job = await Job.findById(jobId);

        if (!job) {
          console.error(`[Webhook] Job not found for accountReference: ${accountReference}`);
        } else {
          const session = await mongoose.startSession();
          try {
            await session.withTransaction(async () => {
              await creditHeldFunds(jobId, amountKobo, eventId, session);
              await WebhookEvent.findOneAndUpdate({ eventId }, { processed: true }, { session });
            });
          } finally {
            session.endSession();
          }
        }
      }

      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
