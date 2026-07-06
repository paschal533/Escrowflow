import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Milestone } from '../models/Milestone.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(requireAuth);

// GET /profile/me — get current user profile (includes bank details if set)
router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

const bankSchema = z.object({
  bankAccountNumber: z.string().min(10).max(10),  // NUBAN: exactly 10 digits
  bankCode: z.string().min(3).max(3),              // CBN bank code: exactly 3 chars
  bankName: z.string().min(2),
});

// PATCH /profile/bank — save bank account details
router.patch('/bank', validate(bankSchema), async (req, res, next) => {
  try {
    const { bankAccountNumber, bankCode, bankName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { bankAccountNumber, bankCode, bankName },
      { new: true, select: '-passwordHash' }
    );
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

// PATCH /profile/me — update name, phone, location, bio, avatar
router.patch('/me', async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'location', 'bio', 'avatar'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      updates,
      { new: true, select: '-passwordHash' }
    );
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// PATCH /profile/password — change password
router.patch('/password', validate(passwordSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) throw new AppError(404, 'User not found');
    const match = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!match) throw new AppError(400, 'Current password is incorrect');
    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ success: true, data: { message: 'Password updated' } });
  } catch (err) { next(err); }
});

// GET /profile/stats?role=CLIENT|PROVIDER
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const role = req.query.role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT';
    const jobFilter = role === 'CLIENT'
      ? { clientId: userId }
      : { providerId: userId };

    const jobs = await Job.find(jobFilter).select('_id status heldAmountKobo releasedAmountKobo');
    const jobIds = jobs.map(j => j._id);

    const escrowBalanceKobo = jobs.reduce((s, j) => s + j.heldAmountKobo, 0);
    const releasedKobo = jobs.reduce((s, j) => s + j.releasedAmountKobo, 0);
    const activeProjects = jobs.filter(j =>
      ['FUNDED', 'IN_PROGRESS'].includes(j.status)
    ).length;
    const pendingApprovals = await Milestone.countDocuments({
      jobId: { $in: jobIds },
      status: 'PROVIDER_MARKED_COMPLETE',
    });

    res.json({ success: true, data: { stats: { escrowBalanceKobo, releasedKobo, activeProjects, pendingApprovals } } });
  } catch (err) { next(err); }
});

const DEFAULT_PREFS = {
  milestoneComplete: { email: true, push: true },
  milestoneApproved: { email: true, push: true },
  projectFunded: { email: true, push: false },
  newInvitation: { email: true, push: true },
  paymentReleased: { email: true, push: true },
  paymentReceived: { email: true, push: true },
  escrowLowBalance: { email: false, push: false },
  disputeUpdate: { email: true, push: true },
};

// GET /profile/notifications
router.get('/notifications', async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId).select('notificationPrefs');
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: { prefs: user.notificationPrefs ?? DEFAULT_PREFS } });
  } catch (err) { next(err); }
});

// PATCH /profile/notifications
router.patch('/notifications', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { notificationPrefs: req.body },
      { new: true, select: 'notificationPrefs' }
    );
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: { prefs: user.notificationPrefs } });
  } catch (err) { next(err); }
});

export default router;
