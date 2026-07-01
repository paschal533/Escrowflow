// src/components/Pricing.tsx
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { TIERS } from "../../data/landing";

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 bg-white dark:bg-navy-950">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-500">Pricing</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-5xl dark:text-white">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          No subscriptions. No hidden fees. You only pay when a milestone is released — and only the party receiving
          funds pays the fee.
        </p>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const f = tier.featured;
            return (
              <div
                key={tier.name}
                className={
                  "rounded-2xl border p-8 " +
                  (f
                    ? "border-navy-800 bg-navy-900 text-white shadow-xl lg:-translate-y-3"
                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900")
                }
              >
                <p
                  className={
                    "text-sm font-bold uppercase tracking-widest " +
                    (f ? "text-brand-400" : "text-slate-500 dark:text-slate-400")
                  }
                >
                  {tier.name}
                </p>
                <div className={"mt-2 font-mono text-5xl font-bold " + (f ? "text-white" : "text-navy-900 dark:text-white")}>
                  {tier.rate}
                </div>
                <p className={"mt-2 text-sm " + (f ? "text-brand-400" : "text-slate-500 dark:text-slate-400")}>
                  Per milestone release
                </p>
                <p className={"mt-1 text-sm font-semibold " + (f ? "text-slate-200" : "text-navy-900 dark:text-white")}>
                  {tier.band}
                </p>

                <ul className="mt-7 space-y-3.5">
                  {tier.features.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <Check className={"mt-0.5 h-4 w-4 shrink-0 " + (f ? "text-brand-400" : "text-brand-500")} />
                      <span className={f ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={
                    "mt-8 block rounded-xl px-5 py-3 text-center text-sm font-semibold transition " +
                    (f
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "border border-slate-200 text-navy-900 hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5")
                  }
                >
                  Get started
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}