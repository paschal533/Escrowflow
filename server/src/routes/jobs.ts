import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Milestone } from '../models/Milestone.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

const milestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  amountKobo: z.number().int().positive(),
  order: z.number().int().min(1),
});

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  providerId: z.string(),
  totalAmountKobo: z.number().int().positive(),
  milestones: z.array(milestoneSchema).min(1),
});

router.post('/', validate(createJobSchema), async (req, res, next) => {
  try {
    const { title, description, providerId, totalAmountKobo, milestones } = req.body;
    const clientId = req.user!.userId;

    const milestoneSum = milestones.reduce(
      (s: number, m: { amountKobo: number }) => s + m.amountKobo,
      0
    );
    if (milestoneSum !== totalAmountKobo) {
      throw new AppError(400, 'Milestone amounts must sum to totalAmountKobo');
    }

    const session = await mongoose.startSession();
    let jobId: mongoose.Types.ObjectId;

    await session.withTransaction(async () => {
      const [job] = await Job.create(
        [{ title, description, clientId, providerId, totalAmountKobo, status: 'CREATED' }],
        { session }
      );
      jobId = job._id as mongoose.Types.ObjectId;
      const milestoneDocs = milestones.map((m: z.infer<typeof milestoneSchema>) => ({
        jobId: jobId,
        title: m.title,
        description: m.description,
        amountKobo: m.amountKobo,
        order: m.order,
        status: 'PENDING',
      }));
      await Milestone.insertMany(milestoneDocs, { session });
    });
    session.endSession();

    const job = await Job.findById(jobId!);
    const createdMilestones = await Milestone.find({ jobId: jobId! }).sort('order');
    res.status(201).json({ success: true, data: { job, milestones: createdMilestones } });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const jobs = await Job.find({ $or: [{ clientId: userId }, { providerId: userId }] })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { jobs } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) throw new AppError(404, 'Job not found');

    const userId = req.user!.userId;
    if (String(job.clientId) !== userId && String(job.providerId) !== userId) {
      throw new AppError(403, 'Access denied');
    }

    const milestones = await Milestone.find({ jobId: job._id }).sort('order');
    res.json({ success: true, data: { job, milestones } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) throw new AppError(404, 'Job not found');
    if (String(job.clientId) !== req.user!.userId) {
      throw new AppError(403, 'Only the client can cancel this job');
    }
    if (!(['CREATED', 'FUNDING_PENDING'] as const).includes(job.status as 'CREATED' | 'FUNDING_PENDING')) {
      throw new AppError(400, 'Job cannot be cancelled in its current status');
    }
    job.status = 'CANCELLED';
    await job.save();
    res.json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
});

export default router;
