
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import AuthField from "./AuthField";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  labelRight?: ReactNode;
};

export default function PasswordField({ label, labelRight, ...rest }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <AuthField
      {...rest}
      label={label}
      labelRight={labelRight}
      icon={Lock}
      type={show ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="text-slate-400 transition hover:text-navy-800 dark:hover:text-white"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      }
    />
  );
}