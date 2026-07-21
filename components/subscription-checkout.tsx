"use client";

import { useCallback, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";
import { startSubscriptionCheckout } from "@/app/actions/stripe";
import { Button } from "@/components/ui/button";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
const failureMessage = "We couldn’t open secure checkout. Your account and progress are saved. Please try again.";

export function SubscriptionCheckout({ planId }: { planId: string; userId?: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCheckout = useCallback(async () => {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      setClientSecret(await startSubscriptionCheckout(planId));
    } catch {
      setError(failureMessage);
    } finally {
      setOpening(false);
    }
  }, [opening, planId]);

  if (!stripePromise) return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Secure checkout is temporarily unavailable. Please try again shortly.</div>;
  if (!clientSecret) return <div className="space-y-4 py-2"><div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground"><div className="flex items-center gap-2 font-medium text-foreground"><LockKeyhole className="h-4 w-4 text-primary" />Secure Stripe Checkout</div><p className="mt-2">Add a payment method to begin your 3-day free trial. You pay $0 today.</p></div>{error && <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}<Button className="w-full" size="lg" onClick={openCheckout} disabled={opening}>{opening ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening Secure Checkout…</> : error ? "Try Again" : "Start Free Trial — $0 Today"}</Button></div>;
  return <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>;
}
