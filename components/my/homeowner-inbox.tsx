'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Clipboard, ExternalLink, MapPin, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type VisitStatus = 'pending' | 'accepted' | 'declined' | 'countered'
type VisitMeta = { status?: VisitStatus } | null

function visitStatusChip(status?: VisitStatus) {
  if (!status) return null
  const styles: Record<VisitStatus, string> = {
    pending: 'bg-muted text-muted-foreground',
    accepted: 'bg-green-600 text-white',
    declined: 'bg-destructive/10 text-destructive',
    countered: 'bg-amber-500/15 text-amber-700',
  }
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', styles[status] ?? 'bg-muted text-muted-foreground')}>{status}</span>
}

type Contractor = string | { name?: string | null; full_name?: string | null; company?: string | null }
type Bid = { share_token: string; contractor: Contractor; total_price: number | string; status: string; timeline?: string | null; created_at: string }
type Question = { id: string; question: string; answer?: string | null; status: string; contractor: Contractor; created_at: string; answered_at?: string | null }
type Visit = { id: string; status: string; contractor: Contractor; created_at: string }
type ThreadMessage = { id?: string; sender: 'homeowner' | 'contractor' | 'system'; kind?: string | null; body: string; meta?: VisitMeta; created_at: string }
type Thread = { thread_id: string; contractor: Contractor; approved: boolean; messages: ThreadMessage[] }
type Inbox = {
  job: { title: string; description?: string | null; category?: string | null; location?: string | null; status: string; job_ref: string; share_token: string; created_at: string }
  bids: Bid[]
  questions: Question[]
  visits: Visit[]
  threads?: Thread[]
}

function contractorName(contractor: Contractor) {
  if (typeof contractor === 'string') return contractor
  return contractor?.company || contractor?.name || contractor?.full_name || 'A contractor'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatMoney(value: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

export function HomeownerInbox({ token }: { token: string }) {
  const [inbox, setInbox] = useState<Inbox | null | undefined>(undefined)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [answering, setAnswering] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<string | null>(null)
  const [counterOpen, setCounterOpen] = useState<Record<string, boolean>>({})
  const [counterText, setCounterText] = useState<Record<string, string>>({})
  const [visitActing, setVisitActing] = useState<string | null>(null)
  const sendingRef = useRef(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    createClient().rpc('get_owner_inbox', { p_token: token }).then(({ data, error }) => {
      if (active) setInbox(error || !data ? null : data as Inbox)
    })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (document.hidden || sendingRef.current) return
      const { data, error } = await createClient().rpc('get_owner_inbox', { p_token: token })
      if (!error && data && !sendingRef.current) {
        setInbox((current) => (current ? (data as Inbox) : current))
      }
    }, 12000)
    return () => window.clearInterval(interval)
  }, [token])

  const pendingQuestions = inbox?.questions.filter((question) => question.status === 'pending') ?? []
  const openBids = inbox?.bids.filter((bid) => bid.status !== 'accepted' && bid.status !== 'declined') ?? []
  const pendingVisits = inbox?.visits.filter((visit) => visit.status === 'pending') ?? []
  const attentionCount = pendingQuestions.length + openBids.length + pendingVisits.length
  const activity = useMemo(() => {
    if (!inbox) return []
    const names = new Set<string>()
    inbox.bids.forEach((item) => names.add(contractorName(item.contractor)))
    inbox.questions.forEach((item) => names.add(contractorName(item.contractor)))
    inbox.visits.forEach((item) => names.add(contractorName(item.contractor)))
    return [...names].map((name) => ({
      name,
      bids: inbox.bids.filter((item) => contractorName(item.contractor) === name).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
      questions: inbox.questions.filter((item) => contractorName(item.contractor) === name).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
      visits: inbox.visits.filter((item) => contractorName(item.contractor) === name).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    }))
  }, [inbox])

  async function shareJob() {
    await navigator.clipboard.writeText(`${window.location.origin}/j/${inbox?.job.share_token}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function answerQuestion(id: string) {
    const answer = answers[id]?.trim()
    if (!answer) return
    setAnswering(id)
    const { data, error } = await createClient().rpc('answer_question_via_inbox', { p_token: token, p_question_id: id, p_answer: answer })
    setAnswering(null)
    if (!error && data?.ok) {
      setInbox((current) => current ? { ...current, questions: current.questions.map((question) => question.id === id ? { ...question, answer, status: 'answered', answered_at: new Date().toISOString() } : question) } : current)
    }
  }

  async function sendThreadMessage(threadId: string) {
    const body = drafts[threadId]?.trim()
    if (!body || sending) return
    sendingRef.current = true
    setSending(threadId)
    const { data, error } = await createClient().rpc('send_owner_message', { p_token: token, p_thread_id: threadId, p_body: body })
    setSending(null)
    sendingRef.current = false
    if (!error && data?.ok) {
      setDrafts((current) => ({ ...current, [threadId]: '' }))
      setInbox((current) => current ? {
        ...current,
        threads: (current.threads ?? []).map((thread) => thread.thread_id === threadId
          ? { ...thread, messages: [...thread.messages, { sender: 'homeowner', body, created_at: new Date().toISOString() }] }
          : thread),
      } : current)
    }
  }

  async function respondVisit(threadId: string, messageId: string, action: 'accept' | 'counter' | 'decline', body: string, note?: string) {
    if (visitActing) return
    if (action === 'counter' && !note) return
    sendingRef.current = true
    setVisitActing(messageId)
    const payload: Record<string, string> = { p_token: token, p_message_id: messageId, p_action: action }
    if (action === 'counter' && note) payload.p_note = note
    const { data, error } = await createClient().rpc('respond_visit', payload)
    setVisitActing(null)
    sendingRef.current = false
    if (!error && data?.ok) {
      const newStatus: VisitStatus = action === 'accept' ? 'accepted' : action === 'counter' ? 'countered' : 'declined'
      setInbox((current) => current ? {
        ...current,
        threads: (current.threads ?? []).map((thread) => {
          if (thread.thread_id !== threadId) return thread
          const messages = thread.messages.map((message) => message.id === messageId ? { ...message, meta: { ...(message.meta ?? {}), status: newStatus } } : message)
          const appended: ThreadMessage[] =
            action === 'accept' ? [{ sender: 'system', kind: 'visit_confirmed', body: `Visit confirmed: ${body}`, created_at: new Date().toISOString() }]
            : action === 'counter' ? [{ sender: 'homeowner', kind: 'visit_counter', body: note ?? '', meta: { status: 'pending' }, created_at: new Date().toISOString() }]
            : [{ sender: 'system', kind: 'text', body: 'Visit time declined.', created_at: new Date().toISOString() }]
          return { ...thread, messages: [...messages, ...appended] }
        }),
      } : current)
      if (action === 'counter') {
        setCounterOpen((current) => ({ ...current, [messageId]: false }))
        setCounterText((current) => ({ ...current, [messageId]: '' }))
      }
    }
  }

  if (inbox === undefined) return <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-muted-foreground">Loading your job inbox…</main>
  if (!inbox) return <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-3 p-6 text-center"><h1 className="text-2xl font-semibold">This link isn&apos;t valid</h1><p className="text-muted-foreground">Check the link and try again.</p></main>

  const { job } = inbox
  const homeownerFirstName = 'you'

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2"><div className="flex items-center gap-2"><Badge variant="secondary">{job.status}</Badge><span className="text-sm text-muted-foreground">{job.job_ref}</span></div><h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{job.title}</h1></div>
          <Button variant="outline" size="sm" onClick={shareJob}><Share2 data-icon="inline-start" />{copied ? 'Copied' : 'Share your job with more pros'}</Button>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><span>Posted {formatDate(job.created_at)}</span><span aria-hidden="true">·</span><span className="flex items-center gap-1"><MapPin data-icon="inline-start" />{job.location}</span></p>
        {job.description && <p className="max-w-2xl text-pretty leading-6 text-muted-foreground">{job.description}</p>}
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="attention-heading"><div className="flex items-center justify-between"><h2 id="attention-heading" className="text-xl font-semibold">Needs your attention</h2>{attentionCount === 0 && <span className="text-sm text-muted-foreground">Nothing needs you right now ✓</span>}</div>
        {pendingQuestions.map((question) => <Card key={question.id}><CardHeader><CardTitle className="text-base">{contractorName(question.contractor)}</CardTitle><CardDescription className="text-base text-foreground">{question.question}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Textarea placeholder="Write your answer…" value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} /><Button className="self-start" onClick={() => answerQuestion(question.id)} disabled={answering === question.id || !answers[question.id]?.trim()}>{answering === question.id ? 'Sending…' : 'Send answer'}</Button></CardContent></Card>)}
        {openBids.map((bid) => <Card key={bid.share_token}><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-col gap-1"><p className="font-medium">{contractorName(bid.contractor)}</p><p className="text-2xl font-semibold">{formatMoney(bid.total_price)}</p>{bid.timeline && <p className="text-sm text-muted-foreground">{bid.timeline}</p>}</div><Button asChild><Link href={`/p/${bid.share_token}`}>View &amp; approve <ExternalLink data-icon="inline-end" /></Link></Button></CardContent></Card>)}
        {pendingVisits.map((visit) => <Card key={visit.id}><CardContent className="p-5"><p><span className="font-medium">{contractorName(visit.contractor)}</span> offered a free in-person estimate — reply to {homeownerFirstName} by text to pick a time.</p></CardContent></Card>)}
      </section>

      {(inbox.threads?.length ?? 0) > 0 && <section className="flex flex-col gap-4" aria-labelledby="messages-heading">
        <h2 id="messages-heading" className="text-xl font-semibold">Messages</h2>
        {inbox.threads!.map((thread) => {
          const confirmed = [...thread.messages].reverse().find((message) => message.kind === 'visit_confirmed')
          return <Card key={thread.thread_id}>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base">{contractorName(thread.contractor)}{thread.approved && <Badge className="bg-green-600 text-white hover:bg-green-600">Approved</Badge>}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {confirmed && <div className="rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 text-sm font-medium text-green-700">✓ {confirmed.body}</div>}
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
              {thread.messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>}
              {thread.messages.map((message, index) => {
                const key = message.id ?? index
                if (message.kind === 'visit_confirmed') return <p key={key} className="mx-auto max-w-[85%] text-balance text-center text-sm font-medium text-green-700">✓ {message.body}</p>
                if (message.kind === 'visit_proposal') {
                  const status = message.meta?.status
                  return <div key={key} className="max-w-[85%] self-start rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">📅 {contractorName(thread.contractor)} proposed a visit</span>{visitStatusChip(status)}</div>
                    <p className="mt-1 text-pretty">{message.body}</p>
                    {status === 'pending' && message.id && <div className="mt-3 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => respondVisit(thread.thread_id, message.id!, 'accept', message.body)} disabled={visitActing === message.id}>Yes, that works</Button>
                        <Button size="sm" variant="outline" onClick={() => setCounterOpen((current) => ({ ...current, [message.id!]: !current[message.id!] }))}>Suggest another time</Button>
                      </div>
                      {counterOpen[message.id] && <div className="flex flex-col gap-2">
                        <Input placeholder="e.g. Thursday after 3pm" value={counterText[message.id] ?? ''} onChange={(event) => setCounterText((current) => ({ ...current, [message.id!]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void respondVisit(thread.thread_id, message.id!, 'counter', message.body, counterText[message.id!]?.trim()) } }} />
                        <Button size="sm" className="self-start" onClick={() => respondVisit(thread.thread_id, message.id!, 'counter', message.body, counterText[message.id!]?.trim())} disabled={visitActing === message.id || !counterText[message.id!]?.trim()}>Send</Button>
                      </div>}
                      <button type="button" className="self-start text-xs text-muted-foreground underline disabled:opacity-50" onClick={() => respondVisit(thread.thread_id, message.id!, 'decline', message.body)} disabled={visitActing === message.id}>Decline</button>
                    </div>}
                  </div>
                }
                if (message.kind === 'visit_counter') return <div key={key} className="max-w-[85%] self-end rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="font-medium">📅 Suggested time</span>{visitStatusChip(message.meta?.status)}</div>
                  <p className="mt-1 text-pretty">{message.body}</p>
                </div>
                if (message.sender === 'system') return <p key={key} className="mx-auto max-w-[85%] text-balance text-center text-xs text-muted-foreground">{message.body}</p>
                const mine = message.sender === 'homeowner'
                return <div key={key} className={cn('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', mine ? 'self-end rounded-br-sm bg-primary text-primary-foreground' : 'self-start rounded-bl-sm bg-muted text-foreground')}>
                  <p className="text-pretty">{message.body}</p>
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{formatDate(message.created_at)}</p>
                </div>
              })}
            </div>
            <div className="flex flex-col gap-2">
              <Textarea placeholder="Write a message…" value={drafts[thread.thread_id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [thread.thread_id]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void sendThreadMessage(thread.thread_id) } }} />
              <Button className="self-end" onClick={() => sendThreadMessage(thread.thread_id)} disabled={sending === thread.thread_id || !drafts[thread.thread_id]?.trim()}>{sending === thread.thread_id ? 'Sending…' : 'Send'}</Button>
            </div>
          </CardContent>
        </Card>
        })}
      </section>}

      <section className="flex flex-col gap-4" aria-labelledby="activity-heading"><h2 id="activity-heading" className="text-xl font-semibold">All activity</h2>{activity.map((group) => <Card key={group.name}><CardHeader><CardTitle className="text-base">{group.name}</CardTitle></CardHeader><CardContent className="flex flex-col gap-4">{group.bids.map((bid) => <p key={`bid-${bid.share_token}`} className="text-sm">{bid.status === 'accepted' && <span className="mr-1">🎉</span>}Sent a {formatMoney(bid.total_price)} bid · <Link className="font-medium underline" href={`/p/${bid.share_token}`}>View bid</Link>{bid.status === 'accepted' && ' · Accepted'}</p>)}{group.questions.map((question) => <div key={`question-${question.id}`} className="flex flex-col gap-1 text-sm"><p>Asked: {question.question}</p>{question.answer && <p className="rounded-lg bg-muted p-3">Your answer: {question.answer}</p>}</div>)}{group.visits.map((visit) => <p key={`visit-${visit.id}`} className="text-sm">Offered a free in-person estimate</p>)}</CardContent></Card>)}</section>
    </div>
  </main>
}
