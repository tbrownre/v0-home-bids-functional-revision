'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createRewardfulAffiliate, type RewardfulAffiliateResult } from '@/app/actions/rewardful'
import {
  CheckCircle2,
  Copy,
  Check,
  Link2,
  Users,
  DollarSign,
  Send,
  Loader2,
} from 'lucide-react'

/**
 * Affiliate signup popup — REWARDFUL edition v2.1 PORTALLOGIN (Sep 26).
 * v2.1: dashboard link -> /login (Rewardful serves the portal at /login; the bare
 * subdomain 404s — Tim hit it live). Helper line tells API-created affiliates to
 * set their first password via "Forgot your password?".
 * Email in → Rewardful affiliate created server-side → success card with the
 * personal 20% link on OUR domain (homebids.ai/?via=name). Commissions come
 * straight off the Stripe $99s; payouts via PayPal.
 *
 * Carries the SAFARIFIX layout (Sep 24): the link wraps (break-all) and every
 * view root has min-w-0, so iPhone Safari can never push the popup wider than
 * the screen.
 */

interface AffiliateSignupModalProps {
  open: boolean
  onClose: () => void
}

type View = 'form' | 'working' | 'success' | 'error'

// Rewardful-hosted affiliate dashboard (from the Rewardful Affiliates page)
const PORTAL = 'https://homebids-llc-1.getrewardful.com/login'

export function AffiliateSignupModal({ open, onClose }: AffiliateSignupModalProps) {
  const [view, setView] = useState<View>('form')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<RewardfulAffiliateResult | null>(null)
  const [copied, setCopied] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const reset = () => {
    setView('form')
    setEmail('')
    setResult(null)
    setCopied(false)
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 300)
  }

  const submit = async () => {
    if (!emailOk || view === 'working') return
    setView('working')
    const res = await createRewardfulAffiliate(email)
    setResult(res)
    setView(res.ok ? 'success' : 'error')
  }

  const copyLink = () => {
    if (!result?.link) return
    try {
      navigator.clipboard.writeText(result.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }

  const shareLink = async () => {
    if (!result?.link) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'HomeBids Pro',
          text: 'Unlimited professional bids for contractors — $99/mo.',
          url: result.link,
        })
      } else {
        copyLink()
      }
    } catch {
      // user cancelled share — no-op
    }
  }

  const smsShare = result?.link
    ? 'sms:?&body=' +
      encodeURIComponent(
        'Check out HomeBids Pro — unlimited professional bids for $99/mo. Sign up here: ' + result.link,
      )
    : undefined

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-md">
        {/* ── FORM ─────────────────────────────────────────────────── */}
        {view === 'form' && (
          <div className="flex min-w-0 flex-col items-center px-1 pb-2 pt-4 text-center">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">
              Start earning with HomeBids.
            </DialogTitle>
            <p className="mt-1.5 text-muted-foreground">Get your referral link in seconds.</p>

            <div className="mt-6 w-full min-w-0">
              <Input
                type="email"
                inputMode="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit()
                }}
                className="h-12"
              />
              <Button
                className="mt-3 h-12 w-full gap-2 text-base font-semibold"
                onClick={submit}
                disabled={!emailOk}
              >
                Create free account →
              </Button>
            </div>

            <p className="mt-4 text-sm font-medium text-foreground">
              20% recurring&nbsp;&nbsp;·&nbsp;&nbsp;Free to join
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tracking by <b>Rewardful</b> · Payouts via <b>PayPal</b>
            </p>

            <div className="mt-6 w-full min-w-0 rounded-2xl bg-muted/60 p-5">
              <p className="text-sm font-bold text-foreground">How does it work?</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: Link2, t: '1. Share your link', d: 'Send it to contractors.' },
                  { icon: Users, t: '2. They go Pro', d: 'Tracked automatically.' },
                  { icon: DollarSign, t: '3. You get paid', d: '20% recurring as long as they stay.' },
                ].map(({ icon: Icon, t, d }) => (
                  <div key={t} className="flex min-w-0 flex-col items-center gap-1.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                    <p className="text-xs font-bold text-foreground">{t}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── WORKING ──────────────────────────────────────────────── */}
        {view === 'working' && (
          <div className="flex min-w-0 flex-col items-center px-1 py-14 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <DialogTitle className="mt-4 text-lg font-semibold text-foreground">
              Setting up your partner account…
            </DialogTitle>
          </div>
        )}

        {/* ── SUCCESS ──────────────────────────────────────────────── */}
        {view === 'success' && result?.ok && (
          <div className="flex min-w-0 flex-col items-center px-1 pb-2 pt-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
              You&apos;re in!
            </DialogTitle>
            <p className="mt-1 text-muted-foreground">Your HomeBids partner account is ready.</p>

            <div className="mt-5 w-full min-w-0 overflow-hidden rounded-xl bg-primary/5 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your referral link
              </p>
              <div className="mt-2 flex items-start gap-2">
                <p className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-foreground">
                  {result.link}
                </p>
                <Button size="sm" className="shrink-0 gap-1.5 font-semibold" onClick={copyLink}>
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-3 w-full min-w-0 rounded-xl bg-muted/60 p-4 text-left">
              <p className="text-sm font-bold text-foreground">You earn 20% recurring.</p>
              <p className="text-sm text-muted-foreground">$19.80/mo per active Pro contractor.</p>
            </div>

            <Button className="mt-4 h-12 w-full gap-2 text-base font-semibold" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy my link
            </Button>
            <div className="mt-2.5 grid w-full grid-cols-2 gap-2.5">
              <Button variant="outline" className="h-11 gap-2 font-semibold" onClick={shareLink}>
                <Send className="h-4 w-4" />
                Share
              </Button>
              <Button asChild variant="outline" className="h-11 gap-2 truncate font-semibold">
                <a href={smsShare}>Send to a contractor</a>
              </Button>
            </div>

            <a
              href={PORTAL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 text-sm font-semibold text-primary hover:underline"
            >
              View my dashboard →
            </a>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Log in there with this email — first time, tap <b>Forgot your password?</b> to set one (10 seconds). Clicks, earnings, and <b>PayPal</b> payout setup all live there. ·
              Tracking by <b>Rewardful</b>
            </p>
          </div>
        )}

        {/* ── ERROR ────────────────────────────────────────────────── */}
        {view === 'error' && (
          <div className="flex min-w-0 flex-col items-center px-1 pb-2 pt-6 text-center">
            <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
              {result?.error === 'email_exists' ? 'That email is already a partner' : "Couldn't finish signup"}
            </DialogTitle>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {result?.error === 'email_exists'
                ? 'This email already has a HomeBids partner account — just log in to your dashboard below.'
                : 'Something hiccuped on our side. Try a different email, or text us and we’ll set you up by hand.'}
            </p>
            <Button asChild className="mt-5 h-12 w-full gap-2 text-base font-semibold">
              <a
                href={result?.error === 'email_exists' ? PORTAL : 'sms:+12832291348?body=I%20need%20help%20with%20my%20HomeBids%20affiliate%20link'}
                target={result?.error === 'email_exists' ? '_blank' : undefined}
                rel={result?.error === 'email_exists' ? 'noopener noreferrer' : undefined}
              >
                {result?.error === 'email_exists' ? 'Log in to my dashboard' : 'Text us for help'}
              </a>
            </Button>
            <button
              type="button"
              onClick={() => setView('form')}
              className="mt-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              ← Try a different email
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
