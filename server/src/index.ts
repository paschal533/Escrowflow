import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import jobsRouter from './routes/jobs.js';
import paymentsRouter from './routes/payments.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/jobs', jobsRouter);
app.use('/payments', paymentsRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  connectDB().catch((err: Error) => {
    console.error('MongoDB connection failed:', err.message);
  });
});

export default app;
