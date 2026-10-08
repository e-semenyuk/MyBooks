// Two-column frame for the sign-in and registration pages: a solid cobalt panel
// with a short statement, and the form beside it. On phones the panel becomes
// a banner above the form.
interface AuthLayoutProps {
  testId: string
  label: string
  statement: string
  children: React.ReactNode
}

export default function AuthLayout({ testId, label, statement, children }: AuthLayoutProps) {
  return (
    <div data-testid={testId} className="grid animate-fade-in border-2 border-ink-950 md:grid-cols-2">
      <div className="flex flex-col justify-between gap-16 bg-cobalt-500 p-8 text-white md:min-h-[560px] md:p-12">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-white/80">{label}</p>
        <p className="font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] md:text-6xl">
          {statement}
        </p>
      </div>
      <div className="p-8 md:p-12">{children}</div>
    </div>
  )
}
