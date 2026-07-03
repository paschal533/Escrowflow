import { Router } from 'express';
import { Milestone } from '../models/Milestone.js';
import { Job } from '../models/Job.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { releaseMilestonePayout } from '../services/transfer.js';

const router = Router();
router.use(requireAuth);

// Provider marks milestone complete
router.post('/:id/complete', async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) throw new AppError(404, 'Milestone not found');

    const job = await Job.findById(milestone.jobId);
    if (!job) throw new AppError(404, 'Job not found');

    if (String(job.providerId) !== req.user!.userId) {
      throw new AppError(403, 'Only the provider can mark a milestone complete');
    }
    if (milestone.status !== 'PENDING') {
      throw new AppError(400, `Milestone is already ${milestone.status}`);
    }
    if (!['FUNDED', 'IN_PROGRESS'].includes(job.status)) {
      throw new AppError(400, 'Job must be funded before marking milestones complete');
    }

    const evidenceUrls: string[] = Array.isArray(req.body.evidenceUrls)
      ? req.body.evidenceUrls
      : [];

    const updated = await Milestone.findByIdAndUpdate(
      req.params.id,
      {
        status: 'PROVIDER_MARKED_COMPLETE',
        evidenceUrls,
        completedAt: new Date(),
        autoReleaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    );

    if (job.status === 'FUNDED') {
      await Job.findByIdAndUpdate(job._id, { status: 'IN_PROGRESS' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Client approves milestone — triggers payout
router.post('/:id/approve', async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) throw new AppError(404, 'Milestone not found');

    const job = await Job.findById(milestone.jobId);
    if (!job) throw new AppError(404, 'Job not found');

    if (String(job.clientId) !== req.user!.userId) {
      throw new AppError(403, 'Only the client can approve a milestone');
    }
    if (milestone.status !== 'PROVIDER_MARKED_COMPLETE') {
      throw new AppError(400, `Milestone status is ${milestone.status}, cannot approve`);
    }

    await releaseMilestonePayout(req.params.id);

    const updated = await Milestone.findById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Either party raises a dispute
router.post('/:id/dispute', async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) throw new AppError(404, 'Milestone not found');

    const job = await Job.findById(milestone.jobId);
    if (!job) throw new AppError(404, 'Job not found');

    const userId = req.user!.userId;
    const isParty =
      String(job.clientId) === userId || String(job.providerId) === userId;
    if (!isParty) throw new AppError(403, 'Access denied');

    if (!['PROVIDER_MARKED_COMPLETE', 'PENDING'].includes(milestone.status)) {
      throw new AppError(400, `Cannot dispute a milestone with status ${milestone.status}`);
    }

    const updated = await Milestone.findByIdAndUpdate(
      req.params.id,
      { status: 'DISPUTED' },
      { new: true }
    );
    await Job.findByIdAndUpdate(job._id, { status: 'DISPUTED' });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
