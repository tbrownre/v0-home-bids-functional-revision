import { Loader2 } from 'lucide-react'

export default function ActivatingAccountLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mt-6 text-balance text-2xl font-semibold text-foreground">Activating Your HomeBids Account</h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">Your payment method was received. We&apos;re activating your free trial now.</p>
      </div>
    </main>
  )
}
