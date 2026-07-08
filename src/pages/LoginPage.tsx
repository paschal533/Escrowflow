import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import PasswordField from "../components/PasswordField";
import { useAuthStore } from "../store/authStore";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Login failed";
      setError("root", { message: msg });
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">Welcome back</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Sign in to your EscrowFlow account</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <AuthField
            id="email"
            label="Email address"
            icon={Mail}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <PasswordField
            id="password"
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            labelRight={
              <a href="#" className="text-sm font-semibold text-navy-800 hover:underline dark:text-brand-400">
                Forgot password?
              </a>
            }
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="h-4 w-4 rounded accent-navy-800 dark:accent-brand-500" />
          Remember me for 30 days
        </label>

        {errors.root && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          {isSubmitting ? "Signing in…" : "Sign in"} <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
}
