import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import PasswordField from "../components/PasswordField";
import { useAuthStore } from "../store/authStore";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
});

type SignupForm = z.infer<typeof signupSchema>;

const ROLES = [
  { id: "CLIENT", title: "Client", desc: "I hire service providers" },
  { id: "PROVIDER", title: "Provider", desc: "I deliver services" },
  { id: "BOTH", title: "Both", desc: "I do both" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

export default function SignupPage() {
  const { signup } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { roles: ["CLIENT"] },
  });

  const selectedRoles = watch("roles");

  const toggleRole = (roleId: RoleId) => {
    const current = selectedRoles ?? [];
    if (roleId === "BOTH") {
      setValue("roles", ["CLIENT", "PROVIDER"], { shouldValidate: true });
    } else {
      const withoutBoth = current.filter((r) => r !== "BOTH");
      const already = withoutBoth.includes(roleId);
      const next = already
        ? withoutBoth.filter((r) => r !== roleId)
        : [...withoutBoth, roleId];
      setValue("roles", next.length ? next : [roleId], { shouldValidate: true });
    }
  };

  const isRoleActive = (roleId: RoleId) => {
    if (roleId === "BOTH") {
      return selectedRoles?.includes("CLIENT") && selectedRoles?.includes("PROVIDER");
    }
    return selectedRoles?.includes(roleId) ?? false;
  };

  const onSubmit = async (data: SignupForm) => {
    try {
      await signup(data);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Signup failed";
      setError("root", { message: msg });
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">Create your account</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Get started with EscrowFlow — it's free.</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <p className="mb-2 text-sm font-semibold text-navy-900 dark:text-white">I want to use EscrowFlow as a…</p>
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.id)}
                aria-pressed={isRoleActive(r.id)}
                className={
                  "rounded-xl border p-3 text-left transition " +
                  (isRoleActive(r.id)
                    ? "border-navy-800 bg-navy-800/5 dark:border-brand-500 dark:bg-brand-500/10"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-navy-900 dark:hover:border-white/20")
                }
              >
                <div className="text-sm font-bold text-navy-900 dark:text-white">{r.title}</div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{r.desc}</div>
              </button>
            ))}
          </div>
          {errors.roles && (
            <p className="mt-1 text-sm text-red-500">{errors.roles.message}</p>
          )}
        </div>

        <div>
          <AuthField
            id="name"
            label="Full name"
            icon={User}
            type="text"
            placeholder="Adaeze Okonkwo"
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

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
          <AuthField
            id="phone"
            label="Phone number"
            icon={Phone}
            type="tel"
            placeholder="+234 800 000 0000"
            autoComplete="tel"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <PasswordField
            id="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded accent-navy-800 dark:accent-brand-500" />
          <span>
            I agree to EscrowFlow's{" "}
            <a href="#" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">Terms of Service</a> and{" "}
            <a href="#" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">Privacy Policy</a>
          </span>
        </label>

        {errors.root && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Create free account"} <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-navy-800 hover:underline dark:text-brand-400">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
