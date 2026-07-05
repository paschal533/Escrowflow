import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  roles: z.array(z.enum(['CLIENT', 'PROVIDER'])).min(1).default(['CLIENT']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string, roles: string[]): string {
  // jwt.sign expiresIn only accepts StringValue or number; cast to any to accept env string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ userId, roles }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
}

router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { name, email, phone, password, roles } = req.body as z.infer<typeof signupSchema>;
    const existing = await User.findOne({ email });
    if (existing) throw new AppError(409, 'Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, passwordHash, roles });
    const token = signToken(String(user._id), user.roles);
    res.status(201).json({
      success: true,
      data: { token, user: { id: user._id, name, email, roles: user.roles } },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email });
    if (!user) throw new AppError(401, 'Invalid email or password');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid email or password');
    const token = signToken(String(user._id), user.roles);
    res.json({
      success: true,
      data: { token, user: { id: user._id, name: user.name, email: user.email, roles: user.roles } },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

export default router;
