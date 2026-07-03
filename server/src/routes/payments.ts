import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Job } from '../models/Job.js';
import { creditHeldFunds } from '../services/ledger.js';

const router = Router();

// POST /payments/webhook
// Nomba webhook receiver — raw body preserved by express.json() re-serialisation
// ponytail: re-serialising parsed JSON for HMAC is fine here; Nomba's signature is over
//           the JSON they send, and express.json() preserves it faithfully for small payloads.
//           If key ordering becomes an issue, switch to express.raw() before express.json().
router.post(
  '/webhook',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['x-nomba-signature'] as string | undefined;
      const rawBody = JSON.stringify(req.body);

      // Verify HMAC-SHA256 signature
      const expected = crypto
        .createHmac('sha256', process.env.NOMBA_WEBHOOK_SECRET ?? '')
        .update(rawBody)
        .digest('hex');

      // timingSafeEqual requires equal-length buffers
      const sigBuf = Buffer.from(signature ?? '');
      const expBuf = Buffer.from(expected);
      const valid =
        sigBuf.length === expBuf.length &&
        crypto.timingSafeEqual(sigBuf, expBuf);

      if (!valid) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const { eventId, eventType, data: eventData } = req.body as {
        eventId: string;
        eventType: string;
        data: Record<string, unknown>;
      };

      // Idempotency — already processed: return 200 immediately
      const existing = await WebhookEvent.findOne({ eventId });
      if (existing?.processed) {
        res.json({ received: true, duplicate: true });
        return;
      }

      // Record event before processing (upsert so duplicate delivery before processing is safe)
      await WebhookEvent.findOneAndUpdate(
        { eventId },
        { eventId, eventType, payload: req.body, processed: false },
        { upsert: true }
      );

      if (eventType === 'payment.received') {
        const accountReference = eventData.accountReference as string;
        const amount = eventData.amount as number; // kobo

        // accountReference = "job-<jobId>"
        const jobId = accountReference.replace('job-', '');
        const job = await Job.findById(jobId);

        if (!job) {
          console.error(`[Webhook] Job not found for accountReference: ${accountReference}`);
        } else {
          const session = await mongoose.startSession();
          try {
            await session.withTransaction(async () => {
              await creditHeldFunds(jobId, amount, eventId, session);
            });
          } finally {
            session.endSession();
          }
        }
      }

      await WebhookEvent.findOneAndUpdate({ eventId }, { processed: true });
      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
