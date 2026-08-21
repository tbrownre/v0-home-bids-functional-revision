'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const HB_CSS = `
:root{--blue:#0A84FF;--blue-press:#0070E0;--blue-tint:#EBF4FF;--blue-line:#CFE5FF;--ink:#17191C;--ink-2:#5C6167;--ink-3:#8A9097;--bg:#F6F5F2;--card:#FFF;--line:#E7E5E0;--green:#16803B;--green-bg:#EAF7EE;--r:22px;--pill:999px;--shadow:0 1px 2px rgba(23,25,28,.04),0 8px 24px rgba(23,25,28,.04)}
.hbc *{box-sizing:border-box}
.hbc{margin:0;background:var(--bg);color:var(--ink);font-family:'Red Hat Text',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:17px;line-height:1.55;min-height:100vh}
.hbc button,.hbc a{font:inherit}.hbc button{cursor:pointer}.hbc a{color:var(--blue);text-decoration:none}
.hbc .wrap{max-width:640px;margin:0 auto;padding:26px 20px 72px}
.hbc .logo{font-family:'Red Hat Display',sans-serif;font-weight:800;font-size:20px}.hbc .logo b{color:var(--blue)}
.hbc .top{display:flex;justify-content:space-between;align-items:center;gap:12px}
.hbc .private{display:inline-flex;align-items:center;gap:6px;color:var(--ink-2);font-size:13px;font-weight:700}
.hbc .statusrow{display:flex;gap:9px;align-items:center;margin-top:28px}
.hbc .badge{display:inline-flex;align-items:center;padding:5px 11px;border-radius:var(--pill);font-size:13px;font-weight:700}
.hbc .badge-blue{background:var(--blue-tint);color:var(--blue)}.hbc .badge-dark{background:var(--ink);color:#fff}.hbc .badge-gray{background:#ECEAE5;color:var(--ink-2)}.hbc .badge-green{background:var(--green-bg);color:var(--green)}
.hbc .jobid{font-family:'Red Hat Mono',monospace;color:var(--ink-3);font-size:12px}
.hbc .title{font-family:'Red Hat Display',sans-serif;font-size:clamp(32px,8vw,42px);line-height:1.08;letter-spacing:-.025em;margin:9px 0 0}
.hbc .meta{color:var(--ink-2);font-size:15px;margin-top:10px}
.hbc .scope{margin:10px 0 0;max-width:54ch}
.hbc .privacy{margin-top:12px;color:var(--ink-3);font-size:13px}
.hbc .sec{margin-top:30px}
.hbc .eyebrow{color:var(--blue);font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase}.hbc .eyebrow.green{color:var(--green)}.hbc .eyebrow.gray{color:var(--ink-3)}
.hbc .card{background:#fff;border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:24px}
.hbc .hero{border-color:var(--blue-line);background:linear-gradient(180deg,#F3F8FF 0%,#FFF 70%)}
.hbc .hero h2{font-family:'Red Hat Display',sans-serif;font-size:28px;line-height:1.18;margin:6px 0 0;letter-spacing:-.015em}
.hbc .sub{color:var(--ink-2);font-size:15px;margin-top:7px}
.hbc .amount{font-family:'Red Hat Display',sans-serif;font-size:44px;font-weight:800;letter-spacing:-.03em;margin-top:16px}
.hbc .primary{width:100%;min-height:58px;border:0;border-radius:var(--pill);background:var(--blue);color:#fff;font-weight:800;font-size:17px;padding:14px 20px;margin-top:20px;display:flex;align-items:center;justify-content:center}.hbc .primary:hover{background:var(--blue-press)}
.hbc .secondary{width:100%;min-height:54px;border:1.5px solid var(--line);border-radius:var(--pill);background:#fff;color:var(--ink);font-weight:700;font-size:16px;padding:12px 18px;margin-top:10px;display:flex;align-items:center;justify-content:center}
.hbc .textbtn{display:block;width:100%;border:0;background:transparent;color:var(--blue);font-weight:700;padding:14px 8px;margin-top:2px;text-align:center}
.hbc .quiet{margin-top:15px;padding-top:15px;border-top:1px solid var(--line);font-size:14px;color:var(--ink-2)}
.hbc .keyfacts{margin-top:17px;background:#F8F7F4;border-radius:16px;padding:4px 16px}
.hbc .fact{display:flex;justify-content:space-between;gap:18px;padding:11px 0;border-bottom:1px solid var(--line);font-size:15px}.hbc .fact:last-child{border-bottom:0}.hbc .fact span{color:var(--ink-2)}
.hbc .nextbox{margin-top:16px;padding:15px 16px;border-radius:15px;background:#F8F7F4;font-size:15px;color:var(--ink-2)}.hbc .nextbox strong{color:var(--ink)}
.hbc .statusline{display:flex;align-items:center;gap:8px;margin-top:10px;color:var(--ink-2);font-size:14px}
.hbc .dot{width:9px;height:9px;border-radius:50%;background:var(--blue)}
.hbc .quote{font-size:19px;font-weight:700;line-height:1.45;margin-top:18px;padding:16px;border-radius:15px;background:#F8F7F4}
.hbc .appt{font-family:'Red Hat Display',sans-serif;font-size:30px;font-weight:800;line-height:1.18;margin-top:10px}
.hbc .addr{font-size:17px;font-weight:700;margin-top:10px}
.hbc .details{margin-top:18px;border-top:1px solid var(--line);padding-top:4px}
.hbc .details summary{cursor:pointer;list-style:none;font-weight:700;padding:14px 0}.hbc .details summary::-webkit-details-marker{display:none}
.hbc .detailrow{display:flex;justify-content:space-between;gap:18px;padding:10px 0;border-top:1px solid var(--line);font-size:15px}.hbc .detailrow span:first-child{color:var(--ink-2)}
.hbc .panel{display:none;margin-top:16px;padding:16px;background:#F8F7F4;border-radius:16px}.hbc .panel.on{display:block}
.hbc .slotrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.hbc .slotinput{width:100%;min-height:48px;border:1.5px solid var(--line);border-radius:12px;padding:10px 14px;background:#fff;color:var(--ink);font-size:15px}.hbc .slotinput:focus{outline:none;border-color:var(--blue)}
.hbc .contactrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.hbc .contactrow .secondary{margin:0}
.hbc .footer{margin-top:52px;padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;align-items:end;color:var(--ink-3);font-size:13px}.hbc .help{color:var(--blue);font-weight:700}
.hbc .toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,8px);background:#17191C;color:#fff;padding:11px 18px;border-radius:999px;font-size:14px;opacity:0;pointer-events:none;transition:.18s;z-index:60;max-width:90vw;text-align:center}.hbc .toast.on{opacity:1;transform:translate(-50%,0)}
@media(max-width:480px){.hbc .wrap{padding:22px 16px 60px}.hbc .card{padding:20px}.hbc .hero h2{font-size:25px}.hbc .amount{font-size:40px}.hbc .footer{align-items:flex-start;flex-direction:column}.hbc .primary,.hbc .secondary{min-height:56px}.hbc .contactrow,.hbc .slotrow{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.hbc *{transition:none!important}}
`

const HB_PHONE = '+12832291348'

type Job = {
  title: string
  job_ref: string
  description?: string | null
  category?: string | null
  location?: string | null
  zip?: string | null
  urgency?: string | null
  status: string
  photos?: number | null
  homeowner_first: string
}
type Bid = { amount: number | string; status: string; share_token: string; created_at: string; first_viewed_at?: string | null } | null
type Slot = { label: string; sub: string }
type SlotsMsg = { id: string; status: string; slots: Slot[]; chosen_index?: number | null; chosen_label?: string | null } | null
type Counter = { id: string; body: string } | null
type Confirmed = { when: string } | null
type PageState = {
  state: 'new' | 'live' | 'estimatewait' | 'confirm' | 'scheduled' | 'finalsent' | 'hired' | 'filled'
  unlocked: boolean
  bid: Bid
  slots_msg: SlotsMsg
  confirmed: Confirmed
  counter: Counter
  visit_address: string | null
}
type Contact = { name: string; phone: string } | null
type Thread = { job: Job; page_state: PageState; homeowner_contact: Contact; messages?: unknown[] }

function money(value: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function relativeTime(value: string) {
  const then = new Date(value).getTime()
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function sms(body: string) {
  return `sms:${HB_PHONE}?body=${encodeURIComponent(body)}`
}

const URGENCY_MAP: Record<string, string> = {
  asap: 'As soon as possible',
  within_week: 'Within a week',
  within_month: 'Within a month',
  flexible: 'Flexible',
}

function humanizeUrgency(value?: string | null) {
  if (!value) return ''
  const key = value.trim().toLowerCase()
  if (URGENCY_MAP[key]) return URGENCY_MAP[key]
  const spaced = value.replace(/_/g, ' ').trim()
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : ''
}

type ChatMessage = { sender?: string; kind?: string; body?: string; created_at?: string }

function latestUnanswered(messages: unknown[] | undefined, otherSender: string, viewerSender: string): ChatMessage | null {
  if (!Array.isArray(messages)) return null
  const texts = (messages as ChatMessage[]).filter((message) => message && message.kind === 'text')
  const time = (message?: ChatMessage) => (message?.created_at ? +new Date(message.created_at) : 0)
  const latestOther = texts.filter((message) => message.sender === otherSender).sort((a, b) => time(b) - time(a))[0]
  if (!latestOther) return null
  const latestViewer = texts.filter((message) => message.sender === viewerSender).sort((a, b) => time(b) - time(a))[0]
  if (latestViewer && time(latestViewer) >= time(latestOther)) return null
  return latestOther
}

export function ContractorThread({ token }: { token: string }) {
  const [thread, setThread] = useState<Thread | null | undefined>(undefined)
  const [composerOpen, setComposerOpen] = useState(false)
  const [rows, setRows] = useState<Slot[]>([
    { label: '', sub: '' },
    { label: '', sub: '' },
    { label: '', sub: '' },
  ])
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replySent, setReplySent] = useState(false)
  const sendingRef = useRef(false)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const interval = window.setInterval(async () => {
      if (document.hidden || sendingRef.current) return
      const { data, error } = await createClient().rpc('get_contractor_thread', { p_token: token })
      if (!error && data && !sendingRef.current) setThread(data as Thread)
    }, 12000)
    return () => window.clearInterval(interval)
  }, [token])

  function say(message: string) {
    setToast(message)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 1800)
  }

  async function refetch() {
    const { data, error } = await createClient().rpc('get_contractor_thread', { p_token: token })
    if (!error && data) setThread(data as Thread)
  }

  async function sendSlots() {
    const filled = rows.filter((row) => row.label.trim() && row.sub.trim())
    if (!filled.length || busy) return
    const first = thread?.job.homeowner_first ?? 'the homeowner'
    sendingRef.current = true
    setBusy(true)
    const { data, error } = await createClient().rpc('propose_visit_slots', { p_token: token, p_slots: filled.map((row) => ({ label: row.label, sub: row.sub })) })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      setComposerOpen(false)
      setRows([{ label: '', sub: '' }, { label: '', sub: '' }, { label: '', sub: '' }])
      say(`Saved — ${first} has been notified`)
      await refetch()
    }
  }

  async function confirmTime() {
    const ps = thread?.page_state
    if (!ps || busy) return
    sendingRef.current = true
    setBusy(true)
    let result
    if (ps.slots_msg && ps.slots_msg.status === 'chosen') {
      result = await createClient().rpc('confirm_visit_slot', { p_token: token, p_message_id: ps.slots_msg.id })
    } else if (ps.counter) {
      result = await createClient().rpc('accept_counter', { p_token: token, p_message_id: ps.counter.id })
    }
    setBusy(false)
    sendingRef.current = false
    if (result && !result.error && result.data?.ok) {
      say('Confirmed')
      await refetch()
    }
  }

  async function sendReply() {
    const body = replyText.trim()
    if (!body || busy) return
    sendingRef.current = true
    setBusy(true)
    const { data, error } = await createClient().rpc('send_thread_message', { p_token: token, p_body: body })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      setReplyText('')
      setReplySent(true)
      say('Reply sent')
      await refetch()
    }
  }

  if (thread === undefined) {
    return <main className="hbc"><div className="wrap" style={{ color: 'var(--ink-2)' }}>Loading your job…</div></main>
  }
  if (!thread) {
    return (
      <main className="hbc">
        <div className="wrap">
          <div className="logo"><b>HOME</b>BIDS</div>
          <h1 className="title" style={{ fontSize: 30 }}>This link isn&apos;t valid</h1>
          <p className="meta">Check the link and try again.</p>
        </div>
      </main>
    )
  }

  const { job, page_state: ps, homeowner_contact: contact } = thread
  const state = ps.state
  const first = job.homeowner_first
  const badgeMap: Record<PageState['state'], [string, string]> = {
    new: ['New lead', 'badge badge-blue'],
    live: ['Bid live', 'badge badge-blue'],
    estimatewait: [`Waiting on ${first}`, 'badge badge-blue'],
    confirm: ['Reply needed', 'badge badge-blue'],
    scheduled: ['Estimate scheduled', 'badge badge-dark'],
    finalsent: ['Final bid sent', 'badge badge-blue'],
    hired: ['Hired', 'badge badge-green'],
    filled: ['Filled', 'badge badge-gray'],
  }
  const [badgeText, badgeClass] = badgeMap[state]
  const locWithZip = `${job.location ?? ''}${job.zip ? ` · ${job.zip}` : ''}`
  const metaText = ps.unlocked && ps.visit_address ? ps.visit_address : locWithZip
  const amount = ps.bid ? money(ps.bid.amount) : ''
  const slotsText = ps.slots_msg?.slots?.map((slot) => `${slot.label} ${slot.sub}`).join(' and ') ?? ''
  const unanswered = latestUnanswered(thread.messages, 'homeowner', 'contractor')
  const showReply = Boolean(unanswered) && !replySent && !['hired', 'filled', 'closed'].includes(state)

  const composer = (
    <div className={`panel${composerOpen ? ' on' : ''}`}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>Offer a free estimate</div>
      <div className="sub">Choose one to three times. {first} will see only these options.</div>
      {rows.map((row, index) => (
        <div className="slotrow" key={index}>
          <input
            className="slotinput"
            placeholder="Tuesday, Aug 18"
            value={row.label}
            onChange={(event) => setRows((current) => current.map((r, i) => (i === index ? { ...r, label: event.target.value } : r)))}
          />
          <input
            className="slotinput"
            placeholder="12:00–2:00 PM"
            value={row.sub}
            onChange={(event) => setRows((current) => current.map((r, i) => (i === index ? { ...r, sub: event.target.value } : r)))}
          />
        </div>
      ))}
      <button className="primary" onClick={sendSlots} disabled={busy}>{busy ? 'Sending…' : `Send times to ${first}`}</button>
    </div>
  )

  return (
    <main className="hbc">
      <style>{HB_CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@600;700;800&family=Red+Hat+Text:wght@400;500;600;700&family=Red+Hat+Mono:wght@500;600&display=swap"
        rel="stylesheet"
      />
      <div className="wrap">
        <header>
          <div className="top">
            <div className="logo"><b>HOME</b>BIDS</div>
            <div className="private">🔒 Private lead</div>
          </div>
          <div className="statusrow">
            <span className={badgeClass}>{badgeText}</span>
            <span className="jobid">{job.job_ref}</span>
          </div>
          <h1 className="title">{job.title}</h1>
          <div className="meta">{metaText}</div>
          {job.description && <p className="scope">{job.description}</p>}
          <div className="privacy">Keep this link private. It lets you act on this job.</div>
        </header>

        {state === 'new' && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow">Next action</div>
            <h2>Send your bid by text</h2>
            <div className="sub">Review the basics here, then tap below. Bid Builder stays in Messages and HomeBids delivers the finished bid to {first}.</div>
            <div className="keyfacts">
              <div className="fact"><span>Job</span><strong>{job.category}</strong></div>
              <div className="fact"><span>Timing</span><strong>{humanizeUrgency(job.urgency)}</strong></div>
              <div className="fact"><span>Photos</span><strong>{job.photos ?? 0} available</strong></div>
              <div className="fact"><span>Location</span><strong>{job.location}</strong></div>
            </div>
            <a className="primary" href={sms(`Hi! I want to bid on this job (Job: ${job.job_ref})`)}>Build bid in Messages</a>
            <a className="textbtn" href={sms(`Hi! I have a question about this job (Job: ${job.job_ref}): `)}>Ask {first} a question first</a>
            <div className="quiet">No dashboard to learn. Build the bid by text like normal.</div>
          </div></div>
        )}

        {state === 'live' && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow">Bid delivered</div>
            <h2>{first} has your {amount} bid</h2>
            <div className="amount">{amount}</div>
            <div className="statusline"><span className="dot" />{ps.bid?.first_viewed_at ? `Viewed by ${first} ${relativeTime(ps.bid.first_viewed_at)}` : 'Delivered — not viewed yet'}</div>
            <div className="nextbox"><strong>You&apos;re all set.</strong> HomeBids will text you when {first} accepts, asks a question, or responds to an estimate offer.</div>
            <button className="secondary" onClick={() => setComposerOpen((value) => !value)}>Offer a free in-person estimate</button>
            <a className="textbtn" href={sms(`I want to update my bid for (Job: ${job.job_ref})`)}>Modify bid in Messages</a>
            {composer}
          </div></div>
        )}

        {state === 'estimatewait' && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow">Estimate offered</div>
            <h2>Waiting for {first} to pick a time</h2>
            <div className="sub">You offered {slotsText}.</div>
            <div className="nextbox"><strong>Nothing else to do.</strong> HomeBids will text you as soon as {first} picks a time or suggests another one.</div>
            <button className="textbtn" onClick={() => setComposerOpen((value) => !value)}>Change offered times</button>
            {composer}
          </div></div>
        )}

        {state === 'confirm' && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow">{first} replied</div>
            <h2>{first} replied</h2>
            <div className="quote">{ps.counter ? ps.counter.body : ps.slots_msg?.chosen_label}</div>
            <button className="primary" onClick={confirmTime} disabled={busy}>{busy ? 'Confirming…' : 'Yes — confirm'}</button>
            <button className="secondary" onClick={() => setComposerOpen((value) => !value)}>Suggest another time</button>
            <div className="quiet">Once you confirm, HomeBids sends {first} the confirmation and unlocks the service address for you.</div>
            {composer}
          </div></div>
        )}

        {state === 'scheduled' && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow green">Estimate scheduled</div>
            <h2>You&apos;re meeting {first}</h2>
            <div className="appt">{ps.confirmed?.when}</div>
            <div className="addr">{ps.visit_address ? ps.visit_address : `${job.location} — exact address appears here once shared`}</div>
            {ps.visit_address && <a className="primary" href={`https://maps.apple.com/?q=${encodeURIComponent(ps.visit_address)}`}>Get directions</a>}
            {contact && (
              <div className="contactrow">
                <a className="secondary" href={`sms:${contact.phone}`}>Text {first}</a>
                <a className="secondary" href={`tel:${contact.phone}`}>Call {first}</a>
              </div>
            )}
            <a className="secondary" href={sms(`I'm ready to confirm the final bid for (Job: ${job.job_ref})`)}>Confirm final bid in Messages</a>
            <button className="textbtn" onClick={() => setComposerOpen((value) => !value)}>Need to change the time?</button>
            <div className="nextbox"><strong>After the visit:</strong> confirm the final quote in Messages. HomeBids will send it back to {first} for approval.</div>
            {composer}
          </div></div>
        )}

        {state === 'finalsent' && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow">Final bid delivered</div>
            <h2>{first} has your final {amount} quote</h2>
            <div className="amount">{amount}</div>
            <div className="nextbox"><strong>You&apos;re all set.</strong> HomeBids will text you if {first} has a question or hires you.</div>
            <a className="textbtn" href={sms(`I need to update my final bid for (Job: ${job.job_ref})`)}>Need to change it?</a>
          </div></div>
        )}

        {state === 'hired' && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow green">You got the job</div>
            <h2>{first} hired you</h2>
            <div className="amount">{amount}</div>
            <div className="sub">The bid is accepted. Coordinate the work directly with {first}.</div>
            {contact && (
              <div className="contactrow">
                <a className="secondary" href={`sms:${contact.phone}`}>Text {first}</a>
                <a className="secondary" href={`tel:${contact.phone}`}>Call {first}</a>
              </div>
            )}
            <div className="nextbox"><strong>Your accepted bid stays saved here</strong> so both sides have the same project record.</div>
          </div></div>
        )}

        {state === 'filled' && (
          <div className="sec"><div className="card">
            <div className="eyebrow gray">Job filled</div>
            <h2 style={{ fontFamily: "'Red Hat Display',sans-serif", fontSize: 28, lineHeight: 1.18, margin: '6px 0 0' }}>{first} chose another pro</h2>
            <div className="sub">No action needed. Your bid stays saved, and this job is now closed.</div>
          </div></div>
        )}

        {showReply && (
          <div className="sec"><div className="card">
            <div className="eyebrow">{first} asked</div>
            <div className="quote">{unanswered?.body}</div>
            <input
              className="slotinput"
              style={{ marginTop: 14 }}
              placeholder={`Reply to ${first}…`}
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void sendReply() } }}
            />
            <button className="primary" onClick={sendReply} disabled={busy || !replyText.trim()}>{busy ? 'Sending…' : 'Send reply'}</button>
          </div></div>
        )}

        <div className="sec"><details className="card details" open>
          <summary>Job details</summary>
          <div className="detailrow"><span>Service</span><strong>{job.category}</strong></div>
          <div className="detailrow"><span>Details</span><strong>{job.description}</strong></div>
          <div className="detailrow"><span>Timeline</span><strong>{humanizeUrgency(job.urgency)}</strong></div>
          <div className="detailrow"><span>Location</span><strong>{locWithZip}</strong></div>
          <div className="detailrow"><span>Photos</span><strong>{job.photos ?? 0}</strong></div>
        </details></div>

        <footer className="footer">
          <div>
            <div className="logo"><b>HOME</b>BIDS</div>
            <div>Better bids. Better homes.</div>
          </div>
          <div>
            <a className="help" href={`sms:${HB_PHONE}`}>Need help? Text HomeBids.</a>
            <div>© 2026 HomeBids.ai</div>
          </div>
        </footer>
      </div>
      <div className={`toast${toast ? ' on' : ''}`} role="status" aria-live="polite">{toast}</div>
    </main>
  )
}
