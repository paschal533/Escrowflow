import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Job } from '../models/Job.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Milestone } from '../models/Milestone.js';
import { User } from '../models/User.js';
import { releaseMilestonePayout } from '../services/transfer.js';
import { debitHeldFundsForRefund } from '../services/ledger.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js'
import { safeEmail, sendRefundIssuedEmail } from '../services/email.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// GET /admin/jobs — list all jobs with optional ?status= filter
router.get('/jobs', async (req, res, next) => {
  try {
    const statusFilter = typeof req.query.status === 'string' ? { status: req.query.status } : {};
    const jobs = await Job.find(statusFilter)
      .populate('clientId', 'name email')
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { jobs } });
  } catch (err) {
    next(err);
  }
});

const resolveSchema = z.object({
  action: z.enum(['approve', 'refund']),
});

// PATCH /admin/milestones/:id/resolve — approve payout or refund a disputed milestone
router.patch('/milestones/:id/resolve', validate(resolveSchema), async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) throw new AppError(404, 'Milestone not found');
    if (milestone.status !== 'DISPUTED') throw new AppError(400, 'Milestone is not in DISPUTED status');

    const job = await Job.findById(milestone.jobId);
    if (!job) throw new AppError(404, 'Job not found');

    const { action } = req.body as z.infer<typeof resolveSchema>;

    if (action === 'approve') {
      await releaseMilestonePayout(String(milestone._id));
    } else {
      // Refund flow
      const idempotencyKey = `refund-${milestone._id}`;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Milestone.findByIdAndUpdate(milestone._id, { status: 'REFUNDED' }, { session });
          await debitHeldFundsForRefund(
            String(job._id),
            milestone.amountKobo,
            idempotencyKey,
            session
          );
          // debitHeldFundsForRefund already decrements heldAmountKobo; override status only
          // ponytail: $inc skipped here — ledger helper already did it, double-write would corrupt balance
          await Job.findByIdAndUpdate(job._id, {
            $set: { status: 'REFUND_PENDING' },
          }, { session });
        });
      } finally {
        session.endSession();
      }
      // ponytail: actual bank transfer is out of scope for MVP — ledger records the refund

      // Notify client of refund — fire-and-forget
      const client = await User.findById(job.clientId).select('email');
      if (client?.email) {
        safeEmail(() => sendRefundIssuedEmail(client.email, milestone.title, milestone.amountKobo));
      }
    }

    const updated = await Milestone.findById(req.params.id);
    res.json({ success: true, data: { milestone: updated } });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [jobStats, ledgerStats] = await Promise.all([
      Job.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      LedgerEntry.aggregate([
        {
          $group: {
            _id: '$type',
            totalKobo: { $sum: '$amountKobo' },
          },
        },
      ]),
    ]);

    const byStatus = Object.fromEntries(jobStats.map((s: { _id: string; count: number }) => [s._id, s.count]));
    const byLedgerType = Object.fromEntries(ledgerStats.map((l: { _id: string; totalKobo: number }) => [l._id, l.totalKobo]));

    const totalJobs = Object.values(byStatus as Record<string, number>).reduce((a, b) => a + b, 0);
    const completedJobs = (byStatus['COMPLETED'] as number) || 0;

    res.json({
      success: true,
      data: {
        totalHeldKobo: byLedgerType['FUNDS_HELD'] || 0,
        totalReleasedKobo: byLedgerType['FUNDS_RELEASED'] || 0,
        totalRefundedKobo: byLedgerType['FUNDS_REFUNDED'] || 0,
        jobsByStatus: byStatus,
        totalJobs,
        activeDisputes: (byStatus['DISPUTED'] as number) || 0,
        completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
