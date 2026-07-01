
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.06 12.25c0-.79-.07-1.54-.2-2.27H12v4.51h6.19c-.27 1.44-1.08 2.66-2.3 3.48v2.89h3.72c2.18-2.01 3.44-4.97 3.44-8.61z" />
      <path fill="#34A853" d="M12 24c3.11 0 5.72-1.03 7.63-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.91 1.1-3.01 0-5.56-2.03-6.47-4.76H1.68v2.98C3.58 21.43 7.49 24 12 24z" />
      <path fill="#FBBC05" d="M5.53 14.66c-.23-.69-.36-1.42-.36-2.16s.13-1.47.36-2.16V7.36H1.68C.9 8.9.5 10.65.5 12.5s.4 3.6 1.18 5.14l3.85-2.98z" />
      <path fill="#EA4335" d="M12 5.58c1.7 0 3.22.58 4.42 1.72l3.31-3.31C17.72 2.15 15.11 1 12 1 7.49 1 3.58 3.57 1.68 7.36l3.85 2.98C6.44 7.61 8.99 5.58 12 5.58z" />
    </svg>
  );
}

export default function GoogleButton() {
  return (
    <button
      type="button"
      // TODO: wire to Firebase / Supabase Google OAuth later
      onClick={() => alert("Google sign-in — connect your auth provider here")}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-navy-900 transition hover:bg-slate-50 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:hover:bg-white/5"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}