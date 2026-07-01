import { ArrowRight, CheckCircle2 } from "lucide-react";
import { STATS } from "../../data/landing";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy-900 dark:bg-navy-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-400 ring-1 ring-brand-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          Now available in Nigeria
        </span>

        <h1 className="mt-8 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Secure service payments through <span className="text-brand-400">milestone-based</span> escrow.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Stop losing money to unreliable contractors. Stop chasing clients who won't pay. EscrowFlow holds funds safely
          and releases them as work gets done.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <a
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-brand-600"
          >
            Create a free account <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-base font-bold text-white transition hover:bg-white/5"
          >
            See how it works
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-300">
          {["No setup fees", "Instant escrow funding", "Both parties protected"].map((t) => (
            <span key={t} className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-400" /> {t}
            </span>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-3xl font-bold text-white sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}