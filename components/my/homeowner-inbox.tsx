'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Clipboard, ExternalLink, MapPin, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

type Contractor = string | { name?: string | null; full_name?: string | null; company?: string | null }
type Bid = { share_token: string; contractor: Contractor; total_price: number | string; status: string; timeline?: string | null; created_at: string }
type Question = { id: string; question: string; answer?: string | null; status: string; contractor: Contractor; created_at: string; answered_at?: string | null }
type Visit = { id: string; status: string; contractor: Contractor; created_at: string }
type Inbox = {
  job: { title: string; description?: string | null; category?: string | null; location?: string | null; status: string; job_ref: string; share_token: string; created_at: string }
  bids: Bid[]
  questions: Question[]
  visits: Visit[]
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    createClient().rpc('get_owner_inbox', { p_token: token }).then(({ data, error }) => {
      if (active) setInbox(error || !data ? null : data as Inbox)
    })
    return () => { active = false }
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

      <section className="flex flex-col gap-4" aria-labelledby="activity-heading"><h2 id="activity-heading" className="text-xl font-semibold">All activity</h2>{activity.map((group) => <Card key={group.name}><CardHeader><CardTitle className="text-base">{group.name}</CardTitle></CardHeader><CardContent className="flex flex-col gap-4">{group.bids.map((bid) => <p key={`bid-${bid.share_token}`} className="text-sm">{bid.status === 'accepted' && <span className="mr-1">🎉</span>}Sent a {formatMoney(bid.total_price)} bid · <Link className="font-medium underline" href={`/p/${bid.share_token}`}>View bid</Link>{bid.status === 'accepted' && ' · Accepted'}</p>)}{group.questions.map((question) => <div key={`question-${question.id}`} className="flex flex-col gap-1 text-sm"><p>Asked: {question.question}</p>{question.answer && <p className="rounded-lg bg-muted p-3">Your answer: {question.answer}</p>}</div>)}{group.visits.map((visit) => <p key={`visit-${visit.id}`} className="text-sm">Offered a free in-person estimate</p>)}</CardContent></Card>)}</section>
    </div>
  </main>
}
