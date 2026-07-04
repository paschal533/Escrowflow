import express from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
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
    res.json(user);
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
    res.json(user);
  } catch (err) { next(err); }
});

export default router;
