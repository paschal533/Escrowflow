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

// POST /payments/webhook
// express.raw() captures the body as a Buffer so HMAC is computed over the exact bytes
// Nomba signed, not a re-serialised version that may differ in whitespace or key order.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawBody = req.body as Buffer;
      const signature = req.headers['nomba-signature'] as string | undefined;

      // Verify HMAC-SHA256 signature over raw bytes
      // Nomba may deliver the signature as hex or base64 — accept both
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody);
      const expectedHex = hmac.digest('hex');
      const expectedB64 = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('base64');

      const sig = signature ?? '';
      const matchHex =
        sig.length === expectedHex.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedHex));
      const matchB64 =
        sig.length === expectedB64.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedB64));
      const valid = matchHex || matchB64;

      if (!valid) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Fix 4: Validate parsed webhook payload
      const payload = JSON.parse(rawBody.toString('utf8'));
      if (!payload || typeof payload !== 'object') {
        res.status(400).json({ error: 'Invalid webhook payload' });
        return;
      }
      const { eventId, eventType, data: eventData } = payload as {
        eventId: string;
        eventType: string;
        data: Record<string, unknown>;
      };
      if (!eventId || !eventType || !eventData || typeof eventData !== 'object') {
        res.status(400).json({ error: 'Missing required webhook fields' });
        return;
      }

      // Fix 3: Tightened idempotency — any existing record (even unprocessed) short-circuits
      const existing = await WebhookEvent.findOne({ eventId });
      if (existing) {
        res.json({ received: true, duplicate: true });
        return;
      }

      // Record event before processing (upsert so duplicate delivery before processing is safe)
      await WebhookEvent.findOneAndUpdate(
        { eventId },
        { eventId, eventType, payload: { eventId, eventType, data: eventData }, processed: false },
        { upsert: true }
      );

      if (eventType === 'payment.received') {
        const accountReference = typeof eventData.accountReference === 'string'
          ? eventData.accountReference
          : '';

        // Fix 5: Safe accountReference extraction
        if (!accountReference.startsWith('job-')) {
          console.error('[Webhook] Unrecognised accountReference:', accountReference);
          res.json({ received: true });
          return;
        }
        const jobId = accountReference.slice(4); // 'job-'.length === 4

        // Nomba sends amount in naira (their API unit); convert to kobo for storage
        const rawAmount = Number(eventData.amount);
        if (!rawAmount || rawAmount <= 0) {
          console.error('[Webhook] Invalid amount in payload:', eventData.amount);
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
            // Fix 2: Mark processed inside the transaction — atomic with ledger writes
            await session.withTransaction(async () => {
              await creditHeldFunds(jobId, amountKobo as number, eventId, session);
              await WebhookEvent.findOneAndUpdate(
                { eventId },
                { processed: true },
                { session }
              );
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
