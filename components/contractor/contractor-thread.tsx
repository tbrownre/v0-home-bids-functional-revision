'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, MapPin, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Job = {
  title: string
  job_ref: string
  description?: string | null
  location?: string | null
  status: string
  homeowner_first: string
}
type Bid = { share_token: string; total_price: number | string; status: string; created_at: string }
type Message = {
  sender: 'contractor' | 'homeowner' | 'system'
  kind?: string | null
  body: string
  meta?: unknown
  created_at: string
}
type Thread = { job: Job; approved: boolean; bids: Bid[]; messages: Message[] }

function formatMoney(value: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function bidStatusBadge(status: string) {
  if (status === 'accepted') return <Badge className="bg-green-600 text-white hover:bg-green-600">Approved 🎉</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

export function ContractorThread({ token }: { token: string }) {
  const [thread, setThread] = useState<Thread | null | undefined>(undefined)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    createClient()
      .rpc('get_contractor_thread', { p_token: token })
      .then(({ data, error }) => {
        if (active) setThread(error || !data ? null : (data as Thread))
      })
    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [thread?.messages.length])

  async function sendMessage() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    const { data, error } = await createClient().rpc('send_thread_message', { p_token: token, p_body: body })
    setSending(false)
    if (!error && data?.ok) {
      setDraft('')
      setThread((current) =>
        current
          ? { ...current, messages: [...current.messages, { sender: 'contractor', body, created_at: new Date().toISOString() }] }
          : current,
      )
    }
  }

  if (thread === undefined) {
    return <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6 text-muted-foreground">Loading your job workspace…</main>
  }
  if (!thread) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">This link isn&apos;t valid</h1>
        <p className="text-muted-foreground">Check the link and try again.</p>
      </main>
    )
  }

  const { job, approved, bids, messages } = thread
  const newestBid = bids.length ? [...bids].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0] : null
  const bidLink = `sms:+12832291348?body=${encodeURIComponent(`Hi! I want to bid on this job (Job: ${job.job_ref})`)}`

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{job.job_ref}</span>
            <Badge variant="secondary">{job.status}</Badge>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{job.title}</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>For {job.homeowner_first}&apos;s job</span>
            {job.location && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <MapPin data-icon="inline-start" />
                  {job.location}
                </span>
              </>
            )}
          </p>
          {job.description && <p className="text-pretty leading-6 text-muted-foreground">{job.description}</p>}
        </header>

        <section aria-label="Your bid">
          {!newestBid ? (
            <a
              href={bidLink}
              className="flex min-h-14 w-full items-center justify-center rounded-lg bg-primary px-6 py-4 text-center text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Finish &amp; send your bid
            </a>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <p className="text-2xl font-semibold">{formatMoney(newestBid.total_price)}</p>
                  {bidStatusBadge(newestBid.status)}
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/p/${newestBid.share_token}`}>
                    View bid page <ExternalLink data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {approved && (
          <div className="rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm font-medium text-green-700">
            Approved — you&apos;re connected with {job.homeowner_first} directly.
          </div>
        )}

        <section className="flex flex-col gap-4" aria-labelledby="messages-heading">
          <h2 id="messages-heading" className="text-xl font-semibold">
            Messages with {job.homeowner_first}
          </h2>
          <div ref={scrollRef} className="flex max-h-[420px] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
            {messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>}
            {messages.map((message, index) => {
              if (message.sender === 'system') {
                return (
                  <p key={index} className="mx-auto max-w-[85%] text-balance text-center text-xs text-muted-foreground">
                    {message.body}
                  </p>
                )
              }
              const mine = message.sender === 'contractor'
              return (
                <div
                  key={index}
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    mine
                      ? 'self-end rounded-br-sm bg-primary text-primary-foreground'
                      : 'self-start rounded-bl-sm bg-muted text-foreground',
                  )}
                >
                  <p className="text-pretty">{message.body}</p>
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{formatTime(message.created_at)}</p>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            <Textarea
              placeholder={`Message ${job.homeowner_first}…`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
            />
            <Button className="self-end gap-2" onClick={sendMessage} disabled={sending || !draft.trim()}>
              <Send data-icon="inline-start" />
              {sending ? 'Sending…' : 'Send'}
            </Button>
            {!approved && (
              <p className="text-sm text-muted-foreground">Contact details stay private until the homeowner approves a bid.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
