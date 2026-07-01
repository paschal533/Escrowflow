
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="bg-navy-600 dark:bg-navy-800">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center lg:py-24">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Ready to make your service payments safe?
        </h2>
        <p className="mt-4 text-lg text-slate-200">
          Join thousands of clients and providers building trust through escrow.
        </p>
        <Link
          to="/signup"
          className="mt-9 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-4 text-base font-bold text-white transition hover:bg-brand-600"
        >
          Get started — it's free <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}