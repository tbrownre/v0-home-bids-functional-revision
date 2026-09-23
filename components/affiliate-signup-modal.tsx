'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createWhopAffiliate, type WhopAffiliateResult } from '@/app/actions/whop'
import {
  CheckCircle2,
  Copy,
  Check,
  Link2,
  Users,
  DollarSign,
  Send,
  ExternalLink,
  Loader2,
  Settings,
} from 'lucide-react'

/**
 * G2 — on-site affiliate signup popup (Tim's mock, Sep 23).
 * Email in → Whop affiliate created server-side → success card with the
 * personal 20% referral link. Any API hiccup lands on a friendly
 * "Continue on Whop" fallback (the proven portal), never a dead end.
 */

interface AffiliateSignupModalProps {
  open: boolean
  onClose: () => void
}

type View = 'form' | 'working' | 'success' | 'error'

export function AffiliateSignupModal({ open, onClose }: AffiliateSignupModalProps) {
  const [view, setView] = useState<View>('form')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<WhopAffiliateResult | null>(null)
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
    const res = await createWhopAffiliate(email)
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {/* ── FORM ─────────────────────────────────────────────────── */}
        {view === 'form' && (
          <div className="flex flex-col items-center px-1 pb-2 pt-4 text-center">
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">
              Start earning with HomeBids.
            </DialogTitle>
            <p className="mt-1.5 text-muted-foreground">Get your referral link in seconds.</p>

            <div className="mt-6 w-full">
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
              Affiliate tracking &amp; payouts powered by <b>Whop</b>
            </p>

            <div className="mt-6 w-full rounded-2xl bg-muted/60 p-5">
              <p className="text-sm font-bold text-foreground">How does it work?</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: Link2, t: '1. Share your link', d: 'Send it to contractors.' },
                  { icon: Users, t: '2. They go Pro', d: 'Whop tracks automatically.' },
                  { icon: DollarSign, t: '3. You get paid', d: '20% recurring as long as they stay.' },
                ].map(({ icon: Icon, t, d }) => (
                  <div key={t} className="flex flex-col items-center gap-1.5">
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
          <div className="flex flex-col items-center px-1 py-14 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <DialogTitle className="mt-4 text-lg font-semibold text-foreground">
              Setting up your partner account…
            </DialogTitle>
          </div>
        )}

        {/* ── SUCCESS ──────────────────────────────────────────────── */}
        {view === 'success' && result?.ok && (
          <div className="flex flex-col items-center px-1 pb-2 pt-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
              You&apos;re in!
            </DialogTitle>
            <p className="mt-1 text-muted-foreground">Your HomeBids partner account is ready.</p>

            <div className="mt-5 w-full rounded-xl bg-primary/5 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your referral link
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">{result.link}</p>
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

            <div className="mt-3 w-full rounded-xl bg-muted/60 p-4 text-left">
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
              <Button asChild variant="outline" className="h-11 gap-2 font-semibold">
                <a href={smsShare}>Send to a contractor</a>
              </Button>
            </div>

            <a
              href={result.portal}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 text-sm font-semibold text-primary hover:underline"
            >
              Go to affiliate dashboard →
            </a>
            <a
              href={result.portal}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:bg-muted"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Settings className="h-4 w-4 text-primary" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">Set up payouts (recommended)</span>
                <span className="block text-xs text-muted-foreground">Required before withdrawing earnings.</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>

            <p className="mt-4 text-[11px] text-muted-foreground">
              You can start sharing your link now and set up payouts later. · Powered by <b>Whop</b>
            </p>
          </div>
        )}

        {/* ── ERROR → friendly Whop fallback ───────────────────────── */}
        {view === 'error' && (
          <div className="flex flex-col items-center px-1 pb-2 pt-6 text-center">
            <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
              One more step on Whop
            </DialogTitle>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              We couldn&apos;t finish the setup automatically for that email. No problem — creating your free
              account on Whop takes about a minute, and your 20% link is issued there instantly.
            </p>
            <Button asChild className="mt-5 h-12 w-full gap-2 text-base font-semibold">
              <a href={result?.portal || 'https://whop.com/homebids/affiliates'} target="_blank" rel="noopener noreferrer">
                Continue on Whop
                <ExternalLink className="h-4 w-4" />
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
