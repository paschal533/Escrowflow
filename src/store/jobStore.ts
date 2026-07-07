import { create } from 'zustand';
import api from '../api/client';

interface MilestoneInput {
  title: string;
  description: string;
  amountKobo: number;
  order: number;
}

interface CreateJobInput {
  title: string;
  description: string;
  providerEmail: string;
  category?: string;
  dueDate?: string;
  milestones: MilestoneInput[];
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  status: string;
  totalAmountKobo: number;
  heldAmountKobo: number;
  releasedAmountKobo: number;
  virtualAccountNumber?: string;
  virtualAccountBank?: string;
  clientId: { _id: string; name: string; email: string };
  providerId: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  amountKobo: number;
  order: number;
  status: string;
  evidenceUrls: string[];
}

interface JobState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  createJob: (data: CreateJobInput) => Promise<Job>;
  fetchJob: (id: string) => Promise<{ job: Job; milestones: Milestone[] }>;
  fundAccount: (id: string) => Promise<Job>;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  loading: false,
  error: null,

  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/jobs');
      set({ jobs: data.data.jobs, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load jobs';
      set({ error: message, loading: false });
    }
  },

  createJob: async (jobData) => {
    const { data } = await api.post('/jobs', jobData);
    return data.data.job;
  },

  fetchJob: async (id) => {
    const { data } = await api.get(`/jobs/${id}`);
    return data.data;
  },

  fundAccount: async (id) => {
    const { data } = await api.patch(`/jobs/${id}/fund-account`);
    return data.data.job;
  },
}));
