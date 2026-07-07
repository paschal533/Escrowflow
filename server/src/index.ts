import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { startAutoReleaseJob } from './jobs/autoRelease.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import jobsRouter from './routes/jobs.js';
import paymentsRouter from './routes/payments.js';
import milestonesRouter from './routes/milestones.js';
import adminRouter from './routes/admin.js';
import profileRouter from './routes/profile.js';

const app = express();

// ponytail: Render sits behind a reverse proxy that sets X-Forwarded-For;
// trust exactly one hop so express-rate-limit keys on the real client IP.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
// ponytail: exclude webhook path so express.raw() in payments.ts receives the raw Buffer for HMAC
app.use((req, res, next) => {
  if (req.path.startsWith('/payments/webhook')) return next();
  express.json()(req, res, next);
});
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/jobs', jobsRouter);
app.use('/payments', paymentsRouter);
app.use('/milestones', milestonesRouter);
app.use('/admin', adminRouter);
app.use('/profile', profileRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  connectDB().catch((err: Error) => {
    console.error('MongoDB connection failed:', err.message);
  });
  startAutoReleaseJob();
});

export default app;
