
import { type ReactNode } from "react";
import Logo from "./ui/Logo";
import ThemeToggle from "./ui/ThemeToggle";
import { useTheme } from "../context/ThemeContext";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      <header className="flex items-center justify-between px-5 py-5 lg:px-8">
        <Logo />
        <ThemeToggle theme={theme} toggle={toggle} />
      </header>
      <main className="flex justify-center px-5 pb-16 pt-6 sm:pt-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}