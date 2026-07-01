
import { type InputHTMLAttributes, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  labelRight?: ReactNode;
  rightSlot?: ReactNode;
};

export default function AuthField({
  label,
  icon: Icon,
  labelRight,
  rightSlot,
  id,
  className,
  ...rest
}: AuthFieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-navy-900 dark:text-white">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          className={
            "w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-navy-800 focus:ring-2 focus:ring-navy-800/10 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-500/20 " +
            (rightSlot ? "pr-11" : "pr-4") +
            (className ? " " + className : "")
          }
          {...rest}
        />
        {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}