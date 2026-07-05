import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';

const REQUIRED_ENV = [
  'NOMBA_BASE_URL',
  'NOMBA_CLIENT_ID',
  'NOMBA_CLIENT_SECRET',
  'NOMBA_PARENT_ACCOUNT_ID',
  'NOMBA_SUB_ACCOUNT_ID',
] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

const PARENT_ID = process.env.NOMBA_PARENT_ACCOUNT_ID!;
const SUB_ACCOUNT_ID = process.env.NOMBA_SUB_ACCOUNT_ID!;
const BASE_URL = process.env.NOMBA_BASE_URL!;

// In-memory token cache — tokens expire after 30 min; refresh 60s early
let tokenCache: { token: string; expiresAt: number } | null = null;
let refreshTokenCache: string | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) return tokenCache.token;

  // Try refresh before re-issuing (saves a round trip)
  if (refreshTokenCache) {
    try {
      const res = await axios.post(
        `${BASE_URL}/v1/auth/token/refresh`,
        { refresh_token: refreshTokenCache },
        { headers: { 'Content-Type': 'application/json', accountId: PARENT_ID } }
      );
      const d = res.data?.data;
      tokenCache = { token: d.access_token, expiresAt: now + 29 * 60 * 1000 };
      if (d.refresh_token) refreshTokenCache = d.refresh_token;
      return tokenCache.token;
    } catch {
      refreshTokenCache = null; // refresh invalid — fall through to re-issue
    }
  }

  const res = await axios.post(
    `${BASE_URL}/v1/auth/token/issue`,
    {
      grant_type: 'client_credentials',
      client_id: process.env.NOMBA_CLIENT_ID,
      client_secret: process.env.NOMBA_CLIENT_SECRET,
    },
    { headers: { 'Content-Type': 'application/json', accountId: PARENT_ID } }
  );
  const d = res.data?.data;
  tokenCache = { token: d.access_token, expiresAt: now + 29 * 60 * 1000 };
  if (d.refresh_token) refreshTokenCache = d.refresh_token;
  return tokenCache.token;
}

async function nombaHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${await getAccessToken()}`,
    accountId: PARENT_ID, // always the parent — Nomba golden rule
    'Content-Type': 'application/json',
    ...extra,
  };
}

export interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  reference: string;
}

export interface TransferParams {
  idempotencyKey: string;
  amountKobo: number;
  destinationAccountNumber: string;
  destinationBankCode: string;
  narration: string;
}

export interface TransferResult {
  reference: string;
  status: string;
}

export async function createVirtualAccount(
  jobId: string,
  _amountKobo: number
): Promise<VirtualAccount> {
  try {
    const res = await axios.post(
      `${BASE_URL}/v1/accounts/virtual/${SUB_ACCOUNT_ID}`,
      { accountRef: `job-${jobId}`, accountName: `EscrowFlow Job ${jobId}` },
      { headers: await nombaHeaders() }
    );
    const data = res.data?.data;
    if (!data?.accountNumber) throw new AppError(502, 'Nomba did not return an account number');
    return {
      accountNumber: data.accountNumber,
      bankName: data.bankName ?? 'Nomba MFB',
      reference: `job-${jobId}`,
    };
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    console.error('[Nomba] createVirtualAccount error:', err);
    throw new AppError(502, 'Payment provider error');
  }
}

export async function initiateTransfer(params: TransferParams): Promise<TransferResult> {
  try {
    const res = await axios.post(
      `${BASE_URL}/v2/transfers/bank/${SUB_ACCOUNT_ID}`,
      {
        amount: params.amountKobo / 100, // kobo → naira; Nomba API uses naira
        destinationAccountNumber: params.destinationAccountNumber,
        destinationBankCode: params.destinationBankCode,
        narration: params.narration,
      },
      { headers: await nombaHeaders({ 'Idempotency-Key': params.idempotencyKey }) }
    );
    const data = res.data?.data;
    return { reference: data.reference, status: data.status };
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    console.error('[Nomba] initiateTransfer error:', err);
    throw new AppError(502, 'Payment provider error');
  }
}
