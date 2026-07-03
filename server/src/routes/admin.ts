import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Job } from '../models/Job.js';
import { Milestone } from '../models/Milestone.js';
import { releaseMilestonePayout } from '../services/transfer.js';
import { debitHeldFundsForRefund } from '../services/ledger.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// GET /admin/jobs — list all jobs with optional ?status= filter
router.get('/jobs', async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const jobs = await Job.find(filter)
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
      await session.withTransaction(async () => {
        await Milestone.findByIdAndUpdate(milestone._id, { status: 'REFUNDED' }, { session });
        await debitHeldFundsForRefund(
          String(job._id),
          milestone.amountKobo,
          idempotencyKey,
          session
        );
        await Job.findByIdAndUpdate(job._id, {
          $inc: { heldAmountKobo: -milestone.amountKobo },
          $set: { status: 'REFUND_PENDING' },
        }, { session });
      });
      session.endSession();
      // ponytail: actual bank transfer is out of scope for MVP — ledger records the refund
    }

    const updated = await Milestone.findById(req.params.id);
    res.json({ success: true, data: { milestone: updated } });
  } catch (err) {
    next(err);
  }
});

export default router;
