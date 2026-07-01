import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import PasswordField from "../components/PasswordField";
import GoogleButton from "../components/GoogleButton";

export default function LoginPage() {
  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">Welcome back</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Sign in to your EscrowFlow account</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <AuthField
          id="email"
          label="Email address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />

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
        />

        <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="h-4 w-4 rounded accent-navy-800 dark:accent-brand-500" />
          Remember me for 30 days
        </label>

        <button
          type="submit"
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 py-3.5 text-sm font-semibold text-white transition hover:bg-navy-700 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          Sign in <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-sm text-slate-400 dark:text-slate-500">or continue with</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>

      <GoogleButton />

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
}