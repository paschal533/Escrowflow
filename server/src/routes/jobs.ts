import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Milestone } from '../models/Milestone.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { createVirtualAccount } from '../services/nomba.js'
import { safeEmail, sendJobCreatedEmail } from '../services/email.js';

const router = Router();
router.use(requireAuth);

const milestoneSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  amountKobo: z.number().int().positive(),
  order: z.number().int().min(1),
});

const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  providerEmail: z.string().email(),
  milestones: z.array(milestoneSchema).min(1),
  category: z.enum(['CONSTRUCTION', 'DESIGN', 'PHOTOGRAPHY', 'TECHNOLOGY', 'INTERIOR', 'OTHER']).optional(),
  dueDate: z.string().optional(),
});

router.post('/', validate(createJobSchema), async (req, res, next) => {
  try {
    const { title, description, providerEmail, milestones } = req.body;
    const clientId = new mongoose.Types.ObjectId(req.user!.userId);

    // ponytail: totalAmountKobo derived server-side — no client value needed
    const totalAmountKobo = milestones.reduce(
      (sum: number, m: { amountKobo: number }) => sum + m.amountKobo,
      0
    );

    const session = await mongoose.startSession();
    let jobId: mongoose.Types.ObjectId;

    await session.withTransaction(async () => {
      const provider = await User.findOne({ email: providerEmail }).session(session);
      if (!provider) throw new AppError(404, `No user found with email ${providerEmail}`);
      if (provider._id.equals(clientId)) throw new AppError(400, 'You cannot hire yourself');

      const [job] = await Job.create(
        [{ title, description, clientId, providerId: provider._id, totalAmountKobo, status: 'CREATED',
           category: req.body.category, dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined }],
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

    const job = await Job.findById(jobId!)
      .populate('clientId', 'name email')
      .populate('providerId', 'name email');
    const createdMilestones = await Milestone.find({ jobId: jobId! }).sort('order');

    // Fire-and-forget — email failure must not block job creation response
    const providerEmailAddr = (job?.providerId as unknown as { email: string })?.email;
    if (providerEmailAddr) {
      safeEmail(() => sendJobCreatedEmail(providerEmailAddr, job!.title));
    }

    res.status(201).json({ success: true, data: { job, milestones: createdMilestones } });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const jobs = await Job.find({ $or: [{ clientId: userId }, { providerId: userId }] })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name email')
      .populate('providerId', 'name email');
    res.json({ success: true, data: { jobs } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.roles.includes('ADMIN');

    // Check access on raw doc (clientId/providerId are ObjectIds here)
    const rawJob = await Job.findById(req.params.id).lean();
    if (!rawJob) throw new AppError(404, 'Job not found');

    const isParty = String(rawJob.clientId) === userId || String(rawJob.providerId) === userId;
    if (!isParty && !isAdmin) throw new AppError(403, 'Access denied');

    // Fetch populated doc for response
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('providerId', 'name email');

    const milestones = await Milestone.find({ jobId: rawJob._id }).sort('order');
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

router.patch('/:id/fund-account', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) throw new AppError(404, 'Job not found');
    if (String(job.clientId) !== req.user!.userId) {
      throw new AppError(403, 'Only the client can trigger account funding');
    }
    if (job.status !== 'CREATED') {
      throw new AppError(400, 'Virtual account can only be created for jobs in CREATED status');
    }

    const va = await createVirtualAccount(String(job._id), job.totalAmountKobo);

    job.virtualAccountNumber = va.accountNumber;
    job.virtualAccountBank = va.bankName;
    job.virtualAccountReference = va.reference;
    job.status = 'FUNDING_PENDING';
    await job.save();

    res.json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
});

export default router;
