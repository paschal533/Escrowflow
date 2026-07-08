import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../../store/jobStore';

const milestoneSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amountNaira: z.number().positive('Amount must be positive'),
  order: z.number().int().min(1),
});

const CATEGORIES = ['CONSTRUCTION', 'DESIGN', 'PHOTOGRAPHY', 'TECHNOLOGY', 'INTERIOR', 'OTHER'] as const;

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  providerEmail: z.string().email('Enter a valid email'),
  category: z.enum(CATEGORIES).optional(),
  dueDate: z.string().optional(),
  milestones: z.array(milestoneSchema).min(1, 'Add at least one milestone'),
});

type FormValues = z.infer<typeof schema>;

export default function CreateJobPage() {
  const navigate = useNavigate();
  const { createJob } = useJobStore();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      milestones: [{ title: '', description: '', amountNaira: 0, order: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });

  const milestones = watch('milestones');
  const total = milestones.reduce((sum, m) => sum + (Number(m.amountNaira) || 0), 0);

  const onSubmit = async (values: FormValues) => {
    try {
      const job = await createJob({
        title: values.title,
        description: values.description,
        providerEmail: values.providerEmail,
        category: values.category,
        dueDate: values.dueDate,
        milestones: values.milestones.map((m) => ({
          title: m.title,
          description: m.description,
          order: m.order,
          amountKobo: Math.round(m.amountNaira * 100),
        })),
      });
      // Immediately create the virtual account so the job reaches FUNDING_PENDING.
      // If this fails, the user lands on the job detail page which shows a fallback button.
      try {
        await useJobStore.getState().fundAccount(job._id);
      } catch {
        // Non-fatal — job detail page has a "Setup Payment Account" fallback button
      }
      navigate(`/dashboard/jobs/${job._id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create job';
      setError('root', { message: msg });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Create a New Job</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Title</label>
          <input
            {...register('title')}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Wedding Dress Tailoring"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select {...register('category')} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Select category</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date (optional)</label>
          <input type="date" {...register('dueDate')} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Provider Email</label>
          <input
            {...register('providerEmail')}
            type="email"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="provider@example.com"
          />
          {errors.providerEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.providerEmail.message}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Milestones</h2>
            <button
              type="button"
              onClick={() =>
                append({
                  title: '',
                  description: '',
                  amountNaira: 0,
                  order: fields.length + 1,
                })
              }
              className="text-sm text-emerald-600 hover:underline"
            >
              + Add Milestone
            </button>
          </div>

          {fields.map((field, i) => (
            <div key={field.id} className="border rounded-lg p-4 mb-3 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-sm">Milestone {i + 1}</span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-red-400 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                {...register(`milestones.${i}.title`)}
                placeholder="Title"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {errors.milestones?.[i]?.title && (
                <p className="text-red-500 text-xs">{errors.milestones[i].title?.message}</p>
              )}
              <input
                {...register(`milestones.${i}.description`)}
                placeholder="Description"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {errors.milestones?.[i]?.description && (
                <p className="text-red-500 text-xs">
                  {errors.milestones[i].description?.message}
                </p>
              )}
              <input
                {...register(`milestones.${i}.amountNaira`, { valueAsNumber: true })}
                type="number"
                placeholder="Amount (₦)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {errors.milestones?.[i]?.amountNaira && (
                <p className="text-red-500 text-xs">
                  {errors.milestones[i].amountNaira?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="font-semibold">Total: ₦{total.toLocaleString()}</p>
        </div>

        {errors.root && <p className="text-red-500">{errors.root.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 text-white rounded-lg py-3 font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Job & Get Payment Details'}
        </button>
      </form>
    </div>
  );
}
