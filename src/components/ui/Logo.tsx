// src/components/Logo.tsx
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-800 text-white dark:bg-brand-500">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold text-navy-900 dark:text-white">EscrowFlow</span>
    </Link>
  );
}