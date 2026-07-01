import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Phone, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import PasswordField from "../components/PasswordField";

const ROLES = [
  { id: "client", title: "Client", desc: "I hire service providers" },
  { id: "provider", title: "Provider", desc: "I deliver services" },
  { id: "both", title: "Both", desc: "I do both" },
] as const;

type Role = (typeof ROLES)[number]["id"];

export default function SignupPage() {
  const [role, setRole] = useState<Role>("client");

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">Create your account</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Get started with EscrowFlow — it's free.</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <p className="mb-2 text-sm font-semibold text-navy-900 dark:text-white">I want to use EscrowFlow as a…</p>
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                className={
                  "rounded-xl border p-3 text-left transition " +
                  (role === r.id
                    ? "border-navy-800 bg-navy-800/5 dark:border-brand-500 dark:bg-brand-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-navy-900 dark:hover:border-white/20")
                }
              >
                <div className="text-sm font-bold text-navy-900 dark:text-white">{r.title}</div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <AuthField id="name" label="Full name" icon={User} type="text" placeholder="Adaeze Okonkwo" autoComplete="name" />
        <AuthField id="email" label="Email address" icon={Mail} type="email" placeholder="you@example.com" autoComplete="email" />
        <AuthField id="phone" label="Phone number" icon={Phone} type="tel" placeholder="+234 800 000 0000" autoComplete="tel" />
        <PasswordField id="password" label="Password" placeholder="At least 8 characters" autoComplete="new-password" />

        <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded accent-navy-800 dark:accent-brand-500" />
          <span>
            I agree to EscrowFlow's{" "}
            <a href="#" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">Terms of Service</a> and{" "}
            <a href="#" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">Privacy Policy</a>
          </span>
        </label>

        <button
          type="submit"
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Create free account <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">Sign in</Link>
      </p>
    </AuthLayout>
  );
}