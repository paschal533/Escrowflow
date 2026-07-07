import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Milestone } from '../models/Milestone.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
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

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  location: z.string().max(200).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().max(500).optional(),
});

// PATCH /profile/me — update name, phone, location, bio, avatar
router.patch('/me', validate(updateProfileSchema), async (req, res, next) => {
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

const notifPrefsEntrySchema = z.object({ email: z.boolean(), push: z.boolean() });
const notificationsSchema = z.object({
  milestoneComplete: notifPrefsEntrySchema.optional(),
  milestoneApproved: notifPrefsEntrySchema.optional(),
  projectFunded: notifPrefsEntrySchema.optional(),
  newInvitation: notifPrefsEntrySchema.optional(),
  paymentReleased: notifPrefsEntrySchema.optional(),
  paymentReceived: notifPrefsEntrySchema.optional(),
  escrowLowBalance: notifPrefsEntrySchema.optional(),
  disputeUpdate: notifPrefsEntrySchema.optional(),
});

// PATCH /profile/notifications
router.patch('/notifications', validate(notificationsSchema), async (req, res, next) => {
  try {
    const existing = await User.findById(req.user!.userId).select('notificationPrefs');
    if (!existing) throw new AppError(404, 'User not found');
    const merged = { ...(DEFAULT_PREFS as object), ...(existing.notificationPrefs ?? {}), ...req.body };
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { notificationPrefs: merged },
      { new: true, select: 'notificationPrefs' }
    );
    res.json({ success: true, data: { prefs: user!.notificationPrefs ?? DEFAULT_PREFS } });
  } catch (err) { next(err); }
});

const typeLabel: Record<string, string> = {
  FUNDS_RECEIVED: 'Escrow Funding',
  FUNDS_HELD: 'Escrow Funding',
  FUNDS_RELEASED: 'Milestone Release',
  FUNDS_REFUNDED: 'Refund',
};

// GET /profile/transactions?role=CLIENT|PROVIDER&filter=all|incoming|outgoing
router.get('/transactions', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const role = req.query.role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT';
    const filter = ['all', 'incoming', 'outgoing'].includes(req.query.filter as string)
      ? req.query.filter as string
      : 'all';
    const jobFilter = role === 'CLIENT' ? { clientId: userId } : { providerId: userId };
    const jobs = await Job.find(jobFilter).populate('clientId providerId', 'name').lean();
    const jobMap = new Map(jobs.map(j => [j._id.toString(), j]));
    const jobIds = jobs.map(j => j._id);

    // Fetch ALL entries for correct stats (no limit here)
    // ponytail: unbounded fetch; add pagination/aggregation if ledger grows very large
    const allEntries = await LedgerEntry.find({ jobId: { $in: jobIds } })
      .select('type amountKobo createdAt jobId')
      .lean();

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalReceivedKobo = 0, totalPaidOutKobo = 0, thisMonthKobo = 0;

    const allRows = allEntries.map(e => {
      const job = jobMap.get(e.jobId.toString());
      const isIncoming = (role === 'CLIENT' && e.type === 'FUNDS_REFUNDED') ||
                         (role === 'PROVIDER' && e.type === 'FUNDS_RELEASED');
      const direction = isIncoming ? 'incoming' : 'outgoing';
      const counterparty = role === 'CLIENT'
        ? (job?.providerId as { name: string } | undefined)?.name ?? 'Unknown'
        : (job?.clientId as { name: string } | undefined)?.name ?? 'Unknown';
      return {
        txnId: `TXN-${e._id.toString().slice(-4).toUpperCase()}`,
        project: job?.title ?? 'Unknown',
        company: counterparty,
        type: typeLabel[e.type] ?? e.type,
        date: e.createdAt,
        amountKobo: e.amountKobo,
        direction,
        status: 'Completed',
      };
    });

    // Stats from ALL entries (no limit)
    for (const r of allRows) {
      if (r.direction === 'incoming') totalReceivedKobo += r.amountKobo;
      else totalPaidOutKobo += r.amountKobo;
      if (new Date(r.date) >= firstOfMonth) thisMonthKobo += r.amountKobo;
    }

    // Pending release = held funds on active jobs
    const activeJobs = jobs.filter(j => ['FUNDED', 'IN_PROGRESS'].includes(j.status));
    const pendingReleaseKobo = activeJobs.reduce((s, j) => s + j.heldAmountKobo, 0);

    // Apply direction filter, sort desc, limit 100 for list display
    const transactions = allRows
      .filter(r => filter === 'all' || r.direction === filter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 100);

    res.json({
      success: true,
      data: {
        stats: { totalReceivedKobo, totalPaidOutKobo, pendingReleaseKobo, thisMonthKobo },
        transactions,
      },
    });
  } catch (err) { next(err); }
});

// GET /profile/disputes?role=CLIENT|PROVIDER
router.get('/disputes', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const role = req.query.role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT';
    const jobFilter = role === 'CLIENT' ? { clientId: userId } : { providerId: userId };
    const jobs = await Job.find(jobFilter).lean();
    const jobMap = new Map(jobs.map(j => [j._id.toString(), j]));
    const jobIds = jobs.map(j => j._id);

    const milestones = await Milestone.find({
      jobId: { $in: jobIds },
      status: { $in: ['DISPUTED', 'REFUNDED'] },
    }).sort({ updatedAt: -1 }).lean();

    const open = milestones.filter(m => m.status === 'DISPUTED').length;
    const resolved = milestones.filter(m => ['REFUNDED'].includes(m.status)).length;
    const fundsAtRiskKobo = milestones
      .filter(m => m.status === 'DISPUTED')
      .reduce((s, m) => s + m.amountKobo, 0);

    const disputes = milestones.map(m => {
      const job = jobMap.get(m.jobId.toString());
      return {
        _id: m._id,
        dspId: `DSP-${m._id.toString().slice(-4).toUpperCase()}`,
        project: job?.title ?? 'Unknown',
        milestone: m.title,
        amountKobo: m.amountKobo,
        status: m.status === 'DISPUTED' ? 'Under Review' : 'Resolved',
        rawStatus: m.status,
        updatedAt: (m as unknown as { updatedAt?: Date }).updatedAt,
      };
    });

    res.json({ success: true, data: { stats: { open, resolved, fundsAtRiskKobo }, disputes } });
  } catch (err) { next(err); }
});

// GET /profile/activity
router.get('/activity', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const jobs = await Job.find({
      $or: [{ clientId: userId }, { providerId: userId }],
    }).lean();
    const jobMap = new Map(jobs.map(j => [j._id.toString(), j]));
    const jobIds = jobs.map(j => j._id);

    const milestones = await Milestone.find({ jobId: { $in: jobIds } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    type ActivityRow = { icon: string; text: string; time: Date };
    const activities: ActivityRow[] = [];

    for (const m of milestones) {
      const job = jobMap.get(m.jobId.toString());
      const title = job?.title ?? 'Unknown';
      if (m.status === 'APPROVED' || m.status === 'TRANSFER_SUCCESS') {
        activities.push({ icon: 'check', text: `Milestone approved: ${m.title}`, time: m.approvedAt ?? (m as unknown as { updatedAt?: Date }).updatedAt ?? new Date() });
      } else if (m.status === 'PROVIDER_MARKED_COMPLETE') {
        activities.push({ icon: 'clock', text: `${title} marked milestone complete`, time: (m as unknown as { updatedAt?: Date }).updatedAt ?? new Date() });
      } else if (m.status === 'DISPUTED') {
        activities.push({ icon: 'alert', text: `Dispute raised on: ${m.title}`, time: (m as unknown as { updatedAt?: Date }).updatedAt ?? new Date() });
      }
    }

    // Also surface recently funded or completed jobs
    for (const j of jobs.filter(j => ['FUNDED', 'COMPLETED'].includes(j.status)).slice(0, 5)) {
      if (j.status === 'FUNDED') {
        activities.push({ icon: 'fund', text: `New project funded: ${j.title}`, time: (j as unknown as { updatedAt?: Date }).updatedAt ?? new Date() });
      } else {
        activities.push({ icon: 'done', text: `Project completed: ${j.title}`, time: (j as unknown as { updatedAt?: Date }).updatedAt ?? new Date() });
      }
    }

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.json({ success: true, data: { activities: activities.slice(0, 10) } });
  } catch (err) { next(err); }
});

export default router;
