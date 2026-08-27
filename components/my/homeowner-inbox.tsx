'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HomeBidsLogo } from '@/components/homebids-logo'

const HB_CSS = `
:root{--blue:#0A84FF;--blue-press:#0070E0;--blue-tint:#EBF4FF;--blue-line:#CFE5FF;--ink:#17191C;--ink-2:#5C6167;--ink-3:#8A9097;--bg:#F6F5F2;--card:#FFF;--line:#E7E5E0;--green:#16803B;--green-bg:#EAF7EE;--amber:#8A6200;--amber-bg:#FFF4D8;--r:22px;--pill:999px;--shadow:0 1px 2px rgba(23,25,28,.04),0 8px 24px rgba(23,25,28,.04)}
.hbo *{box-sizing:border-box}
.hbo{margin:0;background:var(--bg);color:var(--ink);font-family:'Red Hat Text',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:17px;line-height:1.55;min-height:100vh}
.hbo button,.hbo a{font:inherit}.hbo button{cursor:pointer}.hbo a{color:var(--blue);text-decoration:none}
.hbo .wrap{max-width:640px;margin:0 auto;padding:26px 20px 72px}
.hbo .logo{font-family:'Red Hat Display',sans-serif;font-weight:800;font-size:20px}.hbo .logo b{color:var(--blue)}
.hbo .top{display:flex;justify-content:space-between;align-items:center;gap:12px}
.hbo .private{display:inline-flex;align-items:center;gap:6px;color:var(--ink-2);font-size:13px;font-weight:700}
.hbo .statusrow{display:flex;gap:9px;align-items:center;margin-top:28px}
.hbo .badge{display:inline-flex;align-items:center;padding:5px 11px;border-radius:var(--pill);font-size:13px;font-weight:700}
.hbo .badge-blue{background:var(--blue-tint);color:var(--blue)}.hbo .badge-dark{background:var(--ink);color:#fff}.hbo .badge-gray{background:#ECEAE5;color:var(--ink-2)}.hbo .badge-green{background:var(--green-bg);color:var(--green)}
.hbo .jobid{font-family:'Red Hat Mono',monospace;color:var(--ink-3);font-size:12px}
.hbo .title{font-family:'Red Hat Display',sans-serif;font-size:clamp(32px,8vw,42px);line-height:1.08;letter-spacing:-.025em;margin:9px 0 0}
.hbo .meta{color:var(--ink-2);font-size:15px;margin-top:10px}
.hbo .scope{margin:10px 0 0;max-width:54ch}
.hbo .privacy{margin-top:12px;color:var(--ink-3);font-size:13px}
.hbo .sec{margin-top:30px}
.hbo .eyebrow{color:var(--blue);font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase}.hbo .eyebrow.green{color:var(--green)}.hbo .eyebrow.gray{color:var(--ink-3)}
.hbo .card{background:#fff;border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:24px}
.hbo .hero{border-color:var(--blue-line);background:linear-gradient(180deg,#F3F8FF 0%,#FFF 70%)}
.hbo .hero h2{font-family:'Red Hat Display',sans-serif;font-size:28px;line-height:1.18;margin:6px 0 0;letter-spacing:-.015em}
.hbo .sub{color:var(--ink-2);font-size:15px;margin-top:7px}
.hbo .amount{font-family:'Red Hat Display',sans-serif;font-size:44px;font-weight:800;letter-spacing:-.03em;margin-top:16px}
.hbo .old{font-family:'Red Hat Text';font-size:17px;font-weight:600;color:var(--ink-3);text-decoration:line-through;margin-left:8px}
.hbo .person{display:flex;align-items:center;gap:12px;margin-top:14px}
.hbo .avatar{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--blue-tint);color:var(--blue);font-weight:800;flex:none}
.hbo .person strong{display:block}.hbo .trust{font-size:14px;color:var(--ink-2);margin-top:1px}
.hbo .primary{width:100%;min-height:58px;border:0;border-radius:var(--pill);background:var(--blue);color:#fff;font-weight:800;font-size:17px;padding:14px 20px;margin-top:20px;display:flex;align-items:center;justify-content:center}.hbo .primary:hover{background:var(--blue-press)}.hbo .primary:disabled{opacity:.6}
.hbo .secondary{width:100%;min-height:54px;border:1.5px solid var(--line);border-radius:var(--pill);background:#fff;color:var(--ink);font-weight:700;font-size:16px;padding:12px 18px;margin-top:10px;display:flex;align-items:center;justify-content:center}
.hbo .textbtn{display:block;width:100%;border:0;background:transparent;color:var(--blue);font-weight:700;padding:14px 8px;margin-top:2px;text-align:center}
.hbo .quiet{margin-top:15px;padding-top:15px;border-top:1px solid var(--line);font-size:14px;color:var(--ink-2)}
.hbo .nextbox{margin-top:16px;padding:15px 16px;border-radius:15px;background:#F8F7F4;font-size:15px;color:var(--ink-2)}.hbo .nextbox strong{color:var(--ink)}
.hbo .details{margin-top:18px;border-top:1px solid var(--line);padding-top:4px}
.hbo .details summary{cursor:pointer;list-style:none;font-weight:700;padding:14px 0}.hbo .details summary::-webkit-details-marker{display:none}
.hbo .detailrow{display:grid;grid-template-columns:110px 1fr;gap:18px;padding:10px 0;border-top:1px solid var(--line);font-size:15px;text-align:left}.hbo .detailrow span:first-child{color:var(--ink-2)}
.hbo .convo{display:flex;flex-direction:column;gap:14px;margin-top:16px}
.hbo .msg{display:flex;flex-direction:column;gap:4px;max-width:85%}.hbo .msg.mine{align-self:flex-end;align-items:flex-end}
.hbo .msgmeta{font-size:12px;color:var(--ink-3)}
.hbo .msgbubble{padding:12px 16px;border-radius:15px;background:#F8F7F4;font-size:16px;font-weight:600;line-height:1.45}.hbo .msg.mine .msgbubble{background:var(--blue-tint)}
.hbo .sentline{margin-top:8px;font-size:13px;color:var(--green);font-weight:700}
.hbo .panel{display:none;margin-top:16px;padding:16px;background:#F8F7F4;border-radius:16px}.hbo .panel.on{display:block}
.hbo .bidline{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:15px}.hbo .bidline:last-child{border-bottom:0;font-weight:800}
.hbo .choice{display:block;width:100%;text-align:left;background:#fff;border:1.5px solid var(--line);border-radius:16px;padding:15px 17px;margin-top:10px;font-weight:800;font-size:16px}.hbo .choice small{display:block;color:var(--ink-2);font-weight:600;margin-top:2px}.hbo .choice:hover,.hbo .choice.sel{border-color:var(--blue);background:var(--blue-tint);color:var(--blue)}.hbo .choice.sel small{color:var(--blue)}
.hbo .quote{font-size:18px;font-weight:700;line-height:1.45;margin-top:16px;padding:16px;border-radius:15px;background:#F8F7F4}
.hbo .appt{font-family:'Red Hat Display',sans-serif;font-size:30px;font-weight:800;line-height:1.18;margin-top:10px}
.hbo .slotinput{width:100%;min-height:48px;border:1.5px solid var(--line);border-radius:12px;padding:10px 14px;margin-top:10px;background:#fff;color:var(--ink);font-size:15px}.hbo .slotinput:focus{outline:none;border-color:var(--blue)}
.hbo .fieldlabel{font-size:14px;font-weight:700;color:var(--ink-2);margin-top:14px}
.hbo .contactrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.hbo .contactrow .secondary{margin:0}
.hbo .footer{margin-top:52px;padding-top:20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;align-items:end;color:var(--ink-3);font-size:13px}.hbo .help{color:var(--blue);font-weight:700}
.hbo .toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,8px);background:#17191C;color:#fff;padding:11px 18px;border-radius:999px;font-size:14px;opacity:0;pointer-events:none;transition:.18s;z-index:60;max-width:90vw;text-align:center}.hbo .toast.on{opacity:1;transform:translate(-50%,0)}
@media(max-width:480px){.hbo .wrap{padding:22px 16px 60px}.hbo .card{padding:20px}.hbo .hero h2{font-size:25px}.hbo .amount{font-size:40px}.hbo .footer{align-items:flex-start;flex-direction:column}.hbo .primary,.hbo .secondary{min-height:56px}.hbo .contactrow{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.hbo *{transition:none!important}}
`

const HB_PHONE = '+12832291348'
const SHARE_BASE = 'https://www.homebids.ai/j/'

type Contractor = string | { name?: string | null; full_name?: string | null; company?: string | null }
type Job = {
  title: string
  description?: string | null
  category?: string | null
  location?: string | null
  status: string
  job_ref: string
  urgency?: string | null
  share_token: string
  created_at: string
}
type Bid = { amount: number | string; share_token: string } | null
type Slot = { label: string; sub: string }
type SlotsMsg = { id: string; slots: Slot[]; chosen_label?: string | null } | null
type Counter = { id: string; body: string } | null
type Confirmed = { when: string } | null
type OwnerState = 'bid' | 'estimate' | 'waiting' | 'scheduled' | 'finalbid' | 'hired' | 'closed'
type PageState = {
  state: OwnerState
  unlocked: boolean
  bid: Bid
  slots_msg: SlotsMsg
  confirmed: Confirmed
  counter: Counter
  visit_address: string | null
}
type Contact = { name: string; phone: string } | null
type Thread = {
  thread_id: string
  contractor: Contractor
  page_state: PageState
  contractor_contact: Contact
  messages?: unknown[]
  handoff_needed?: boolean
  accepted_share_token?: string | null
}
type Inbox = {
  job: Job
  any_bids: boolean
  threads: Thread[]
}

function contractorName(contractor: Contractor) {
  if (typeof contractor === 'string') return contractor || 'A contractor'
  return contractor?.company || contractor?.name || contractor?.full_name || 'A contractor'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

function money(value: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function postedDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
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

  type ChatMessage = { sender?: string; kind?: string; body?: string; created_at?: string; meta?: { url?: string } | null }

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

const HEADER_PRIORITY: OwnerState[] = ['hired', 'scheduled', 'finalbid', 'waiting', 'estimate', 'bid', 'closed']
const BADGE: Record<OwnerState | 'collecting', [string, string]> = {
  collecting: ['Getting bids', 'badge badge-blue'],
  bid: ['Bid ready', 'badge badge-blue'],
  estimate: ['Estimate offered', 'badge badge-blue'],
  waiting: ['Waiting on a pro', 'badge badge-blue'],
  scheduled: ['Estimate scheduled', 'badge badge-dark'],
  finalbid: ['Final bid ready', 'badge badge-blue'],
  hired: ['Pro hired', 'badge badge-green'],
  closed: ['Closed', 'badge badge-gray'],
}

export function HomeownerInbox({ token }: { token: string }) {
  const [inbox, setInbox] = useState<Inbox | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [panelOpen, setPanelOpen] = useState<Record<string, boolean>>({})
  const [askOpen, setAskOpen] = useState<Record<string, boolean>>({})
  const [askText, setAskText] = useState<Record<string, string>>({})
  const [selectedSlot, setSelectedSlot] = useState<Record<string, number>>({})
  const [addressText, setAddressText] = useState<Record<string, string>>({})
  const [suggestOpen, setSuggestOpen] = useState<Record<string, boolean>>({})
  const [suggestText, setSuggestText] = useState<Record<string, string>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [justSent, setJustSent] = useState<Record<string, boolean>>({})
  const [handoff, setHandoff] = useState<Record<string, { name: string; address: string; email: string; phone: string }>>({})
  const [handoffDone, setHandoffDone] = useState<Record<string, boolean>>({})
  const [handoffError, setHandoffError] = useState<Record<string, string>>({})
  const [uploadingThread, setUploadingThread] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<Record<string, string>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const sendingRef = useRef(false)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrolledToMessagesRef = useRef(false)

  useEffect(() => {
    if (scrolledToMessagesRef.current) return
    if (inbox === undefined || inbox === null) return
    if (typeof window === 'undefined' || window.location.hash !== '#messages') return
    scrolledToMessagesRef.current = true
    setTimeout(() => {
      document.getElementById('messages')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 600)
  }, [inbox])

  useEffect(() => {
    let active = true
    createClient()
      .rpc('get_owner_inbox', { p_token: token })
      .then(({ data, error }) => {
        if (active) setInbox(error || !data ? null : (data as Inbox))
      })
    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (document.hidden || sendingRef.current) return
      const { data, error } = await createClient().rpc('get_owner_inbox', { p_token: token })
      if (!error && data && !sendingRef.current) setInbox(data as Inbox)
    }, 12000)
    return () => window.clearInterval(interval)
  }, [token])

  function say(message: string) {
    setToast(message)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 1800)
  }

  async function refetch() {
    const { data, error } = await createClient().rpc('get_owner_inbox', { p_token: token })
    if (!error && data) setInbox(data as Inbox)
  }

  async function shareWithPro(shareToken: string) {
    try {
      await navigator.clipboard.writeText(`${SHARE_BASE}${shareToken}`)
      say('Link copied — share it with any pro')
    } catch {
      say('Could not copy the link')
    }
  }

  async function acceptBid(bid: Bid) {
    if (!bid || busy) return
    sendingRef.current = true
    setBusy(true)
    const { data, error } = await createClient().rpc('accept_proposal', { p_token: bid.share_token })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      say('Accepted — the pro has been notified')
      await refetch()
    }
  }

  async function askQuestion(threadId: string) {
    const body = askText[threadId]?.trim()
    if (!body || busy) return
    sendingRef.current = true
    setBusy(true)
    const { data, error } = await createClient().rpc('send_owner_message', { p_token: token, p_thread_id: threadId, p_body: body })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      setAskText((current) => ({ ...current, [threadId]: '' }))
      setAskOpen((current) => ({ ...current, [threadId]: false }))
      say('Question sent')
    }
  }

  async function confirmSlot(threadId: string, slotsMsgId: string) {
    const index = selectedSlot[threadId]
    if (index == null || index < 0 || busy) return
    sendingRef.current = true
    setBusy(true)
    const { data, error } = await createClient().rpc('choose_visit_slot', {
      p_token: token,
      p_message_id: slotsMsgId,
      p_slot_index: index,
      p_address: addressText[threadId]?.trim() || null,
    })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      say('Time sent to the pro')
      await refetch()
    }
  }

  async function suggestOther(threadId: string, slotsMsgId: string) {
    const note = suggestText[threadId]?.trim()
    if (!note || busy) return
    sendingRef.current = true
    setBusy(true)
    const { data, error } = await createClient().rpc('suggest_other_slot', { p_token: token, p_message_id: slotsMsgId, p_note: note })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      setSuggestText((current) => ({ ...current, [threadId]: '' }))
      setSuggestOpen((current) => ({ ...current, [threadId]: false }))
      say('Suggestion sent to the pro')
      await refetch()
    }
  }

  async function sendReply(threadId: string) {
    const body = replyText[threadId]?.trim()
    if (!body || busy) return
    sendingRef.current = true
    setBusy(true)
    const { data, error } = await createClient().rpc('send_owner_message', { p_token: token, p_thread_id: threadId, p_body: body })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      setReplyText((current) => ({ ...current, [threadId]: '' }))
      setInbox((current) =>
        current
          ? {
              ...current,
              threads: current.threads.map((thread) =>
                thread.thread_id === threadId
                  ? { ...thread, messages: [...(thread.messages ?? []), { sender: 'homeowner', kind: 'text', body, created_at: new Date().toISOString() }] }
                  : thread,
              ),
            }
          : current,
      )
      setJustSent((current) => ({ ...current, [threadId]: true }))
      say('Reply sent')
      await refetch()
    }
  }

  async function uploadPhoto(threadId: string, file: File) {
    if (uploadingThread) return
    setPhotoError((current) => ({ ...current, [threadId]: '' }))
    setUploadingThread(threadId)
    sendingRef.current = true
    try {
      const body = new FormData()
      body.append('side', 'homeowner')
      body.append('token', token)
      body.append('thread_id', threadId)
      body.append('file', file)
      const response = await fetch('/api/thread-photo', { method: 'POST', body })
      const result = await response.json()
      if (response.ok && result?.ok) {
        setInbox((current) =>
          current
            ? {
                ...current,
                threads: current.threads.map((thread) =>
                  thread.thread_id === threadId
                    ? { ...thread, messages: [...(thread.messages ?? []), { sender: 'homeowner', kind: 'photo', body: '', meta: { url: result.url }, created_at: new Date().toISOString() }] }
                    : thread,
                ),
              }
            : current,
        )
        setJustSent((current) => ({ ...current, [threadId]: true }))
        say('Photo sent')
        await refetch()
      } else {
        setPhotoError((current) => ({ ...current, [threadId]: (result?.error as string) || 'Upload failed. Please try again.' }))
      }
    } catch {
      setPhotoError((current) => ({ ...current, [threadId]: 'Upload failed. Please try again.' }))
    } finally {
      setUploadingThread(null)
      sendingRef.current = false
    }
  }

  async function submitHandoff(thread: Thread) {
    const values = handoff[thread.thread_id]
    if (!values?.name?.trim() || !values?.address?.trim() || !values?.email?.trim() || busy) return
    sendingRef.current = true
    setBusy(true)
    setHandoffError((current) => ({ ...current, [thread.thread_id]: '' }))
    const { data, error } = await createClient().rpc('submit_handoff_details', {
      p_owner_token: token,
      p_share_token: thread.accepted_share_token,
      p_name: values.name.trim(),
      p_address: values.address.trim(),
      p_email: values.email.trim(),
      p_phone: values.phone?.trim() || null,
    })
    setBusy(false)
    sendingRef.current = false
    if (!error && data?.ok) {
      setHandoffDone((current) => ({ ...current, [thread.thread_id]: true }))
      say("Sent — you're connected 🎉")
      await refetch()
    } else {
      setHandoffError((current) => ({ ...current, [thread.thread_id]: (data?.error as string) || 'Something went wrong. Please try again.' }))
    }
  }

  if (inbox === undefined) {
    return <main className="hbo"><div className="wrap" style={{ color: 'var(--ink-2)' }}>Loading your project…</div></main>
  }
  if (!inbox) {
    return (
      <main className="hbo">
        <div className="wrap">
          <HomeBidsLogo size="20px" />
          <h1 className="title" style={{ fontSize: 30 }}>This link isn&apos;t valid</h1>
          <p className="meta">Check the link and try again.</p>
        </div>
      </main>
    )
  }

  const { job, any_bids: anyBids, threads } = inbox
  const collecting = threads.length === 0 && !anyBids
  const headerState: OwnerState | 'collecting' = collecting
    ? 'collecting'
    : HEADER_PRIORITY.find((state) => threads.some((thread) => thread.page_state.state === state)) ?? 'bid'
  const [badgeText, badgeClass] = BADGE[headerState]

  return (
    <main className="hbo">
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
            <HomeBidsLogo size="20px" />
            <div className="private">🔒 Private project</div>
          </div>
          <div className="statusrow">
            <span className={badgeClass}>{badgeText}</span>
            <span className="jobid">{job.job_ref}</span>
          </div>
          <h1 className="title">{job.title}</h1>
          <div className="meta">{job.location} · Posted {postedDate(job.created_at)}</div>
          {job.description && <p className="scope">{job.description}</p>}
          <div className="privacy">Keep this link private. Anyone with it can act on your project.</div>
        </header>

        {collecting && (
          <div className="sec"><div className="card hero">
            <div className="eyebrow">Getting bids</div>
            <h2>We&apos;re finding pros for you</h2>
            <div className="sub">Local pros have been notified. HomeBids will text you as soon as a bid or question arrives.</div>
            <div className="nextbox"><strong>Nothing to do right now.</strong> You can close this page and come back from the same private link anytime.</div>
            <button className="secondary" onClick={() => shareWithPro(job.share_token)}>Share with another pro</button>
          </div></div>
        )}

        <div id="messages" style={{ scrollMarginTop: 16 }}>
        {[...threads]
          .map((thread, index) => ({ thread, index }))
          .sort((a, b) => {
            const rank = (state: string) => (state === 'hired' ? 0 : state === 'closed' ? 2 : 1)
            const diff = rank(a.thread.page_state.state) - rank(b.thread.page_state.state)
            return diff !== 0 ? diff : a.index - b.index
          })
          .map(({ thread }) => {
          const ps = thread.page_state
          const name = contractorName(thread.contractor)
          const contact = thread.contractor_contact
          const amount = ps.bid ? money(ps.bid.amount) : ''

          const person = (trust: string) => (
            <div className="person">
              <div className="avatar">{initials(name)}</div>
              <div><strong>{name}</strong><div className="trust">{trust}</div></div>
            </div>
          )

          const hero = (() => {
          if (ps.state === 'bid') {
            return (
              <div className="sec" key={thread.thread_id}><div className="card hero">
                <div className="eyebrow">New bid</div>
                <h2>{name} sent you a {amount} bid</h2>
                <div className="amount">{amount}</div>
                {person('Verified HomeBids pro')}
                <button className="primary" onClick={() => setPanelOpen((current) => ({ ...current, [thread.thread_id]: !current[thread.thread_id] }))}>Review the bid</button>
                <button className="textbtn" onClick={() => setAskOpen((current) => ({ ...current, [thread.thread_id]: !current[thread.thread_id] }))}>Ask {name} a question</button>
                {askOpen[thread.thread_id] && (
                  <div>
                    <input className="slotinput" placeholder={`Ask ${name} a question…`} value={askText[thread.thread_id] ?? ''} onChange={(event) => setAskText((current) => ({ ...current, [thread.thread_id]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void askQuestion(thread.thread_id) } }} />
                    <button className="secondary" onClick={() => askQuestion(thread.thread_id)} disabled={busy || !askText[thread.thread_id]?.trim()}>Send question</button>
                  </div>
                )}
                <div className={`panel${panelOpen[thread.thread_id] ? ' on' : ''}`}>
                  <button className="primary" style={{ marginTop: 0 }} onClick={() => acceptBid(ps.bid)} disabled={busy}>{busy ? 'Working…' : `Accept ${amount} bid`}</button>
                  {ps.bid && <a className="secondary" href={`/p/${ps.bid.share_token}`}>View full bid</a>}
                </div>
                <div className="quiet">You don&apos;t have to decide now. We&apos;ll text you if {name} updates the bid or offers a visit.</div>
              </div></div>
            )
          }

          if (ps.state === 'estimate') {
            const selected = selectedSlot[thread.thread_id]
            const slotsMsgId = ps.slots_msg?.id
            return (
              <div className="sec" key={thread.thread_id}><div className="card hero">
                <div className="eyebrow">{name} offered a free estimate</div>
                <h2>Pick a time that works for you</h2>
                <div className="sub">{name} offered these times to see the space before you decide.</div>
                {ps.slots_msg?.slots?.map((slot, index) => (
                  <button
                    key={index}
                    className={`choice${selected === index ? ' sel' : ''}`}
                    onClick={() => setSelectedSlot((current) => ({ ...current, [thread.thread_id]: index }))}
                  >
                    {slot.label}<small>{slot.sub}</small>
                  </button>
                ))}
                {selected != null && selected >= 0 && slotsMsgId && (
                  <div>
                    <div className="fieldlabel">Address for the visit (shared once confirmed)</div>
                    <input className="slotinput" style={{ marginTop: 6 }} placeholder="123 Main St, Gilbert, AZ" value={addressText[thread.thread_id] ?? ''} onChange={(event) => setAddressText((current) => ({ ...current, [thread.thread_id]: event.target.value }))} />
                    <button className="primary" onClick={() => confirmSlot(thread.thread_id, slotsMsgId)} disabled={busy}>{busy ? 'Confirming…' : 'Confirm this time'}</button>
                  </div>
                )}
                <button className="textbtn" onClick={() => setSuggestOpen((current) => ({ ...current, [thread.thread_id]: !current[thread.thread_id] }))}>Neither works — suggest another time</button>
                {suggestOpen[thread.thread_id] && slotsMsgId && (
                  <div>
                    <input className="slotinput" placeholder="e.g. Thursday after 3 PM" value={suggestText[thread.thread_id] ?? ''} onChange={(event) => setSuggestText((current) => ({ ...current, [thread.thread_id]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void suggestOther(thread.thread_id, slotsMsgId) } }} />
                    <button className="secondary" onClick={() => suggestOther(thread.thread_id, slotsMsgId)} disabled={busy || !suggestText[thread.thread_id]?.trim()}>Send suggestion</button>
                  </div>
                )}
                <div className="quiet">Choosing a time does <strong>not</strong> hire {name}. You&apos;re only scheduling the free estimate.</div>
              </div></div>
            )
          }

          if (ps.state === 'waiting') {
            const suggested = Boolean(ps.counter)
            return (
              <div className="sec" key={thread.thread_id}><div className="card hero">
                <div className="eyebrow">Waiting on {name}</div>
                <h2>{suggested ? 'You suggested a time' : 'You picked a time'}</h2>
                <div className="quote">{ps.counter?.body || ps.slots_msg?.chosen_label}</div>
                <div className="nextbox"><strong>You&apos;re done for now.</strong> HomeBids texted {name}. We&apos;ll text you the moment they confirm or suggest another time.</div>
              </div></div>
            )
          }

          if (ps.state === 'scheduled') {
            return (
              <div className="sec" key={thread.thread_id}><div className="card hero">
                <div className="eyebrow green">Estimate scheduled</div>
                <h2>{name} is coming</h2>
                <div className="appt">{ps.confirmed?.when}</div>
                <div className="sub">Free in-person estimate at your home.</div>
                {contact && (
                  <div className="contactrow">
                    <a className="secondary" href={`sms:${contact.phone}`}>Text {name}</a>
                    <a className="secondary" href={`tel:${contact.phone}`}>Call {name}</a>
                  </div>
                )}
                <div className="nextbox"><strong>That&apos;s it for now.</strong> After the visit, HomeBids will bring you back here for {name}&apos;s final quote.</div>
              </div></div>
            )
          }

          if (ps.state === 'finalbid') {
            return (
              <div className="sec" key={thread.thread_id}><div className="card hero">
                <div className="eyebrow">Final bid ready</div>
                <h2>{name} confirmed the final price</h2>
                <div className="amount">{amount}</div>
                {person('Final quote after the in-person estimate')}
                <button className="primary" onClick={() => setPanelOpen((current) => ({ ...current, [thread.thread_id]: !current[thread.thread_id] }))}>Review final bid</button>
                <div className={`panel${panelOpen[thread.thread_id] ? ' on' : ''}`}>
                  <button className="primary" style={{ marginTop: 0 }} onClick={() => acceptBid(ps.bid)} disabled={busy}>{busy ? 'Working…' : `Hire ${name} for ${amount}`}</button>
                  {ps.bid && <a className="secondary" href={`/p/${ps.bid.share_token}`}>View full bid</a>}
                </div>
              </div></div>
            )
          }

          if (ps.state === 'hired') {
            return (
              <div className="sec" key={thread.thread_id}><div className="card hero">
                <div className="eyebrow green">It&apos;s official</div>
                <h2>You hired {name}</h2>
                <div className="amount">{amount}</div>
                <div className="sub">Bidding is closed. You and {name} can now coordinate the work directly.</div>
                {contact && (
                  <div className="contactrow">
                    <a className="secondary" href={`sms:${contact.phone}`}>Text {name}</a>
                    <a className="secondary" href={`tel:${contact.phone}`}>Call {name}</a>
                  </div>
                )}
                <div className="nextbox"><strong>HomeBids will keep this page available</strong> so you always have the accepted bid and project details in one place.</div>
              </div></div>
            )
          }

          if (ps.state === 'closed') {
            return (
              <div className="sec" key={thread.thread_id}><div className="card">
                <div className="eyebrow gray">Project closed</div>
                <h2 style={{ fontFamily: "'Red Hat Display',sans-serif", fontSize: 28, lineHeight: 1.18, margin: '6px 0 0' }}>You chose another pro</h2>
                <div className="sub">{name}&apos;s bid has been closed. No further action is needed with {name}.</div>
              </div></div>
            )
          }

          return null
          })()

          const unanswered = latestUnanswered(thread.messages, 'contractor', 'homeowner')
          const textMessages = (Array.isArray(thread.messages) ? (thread.messages as ChatMessage[]) : [])
            .filter((message) => message && (message.kind === 'text' || message.kind === 'photo'))
            .sort((a, b) => (a.created_at ? +new Date(a.created_at) : 0) - (b.created_at ? +new Date(b.created_at) : 0))
          const showConvo = !(textMessages.length === 0 && ps.state === 'closed')
          const showHandoff = Boolean(thread.handoff_needed) && !handoffDone[thread.thread_id]
          const form = handoff[thread.thread_id] ?? { name: '', address: '', email: '', phone: '' }
          const setForm = (patch: Partial<typeof form>) =>
            setHandoff((current) => ({ ...current, [thread.thread_id]: { ...form, ...patch } }))

          return (
            <Fragment key={thread.thread_id}>
              {showHandoff && (
                <div className="sec"><div className="card hero">
                  <div className="eyebrow green">Last step</div>
                  <h2>Finish connecting with {name}</h2>
                  <div className="sub">Share your details once and we&apos;ll send everything over — then you two take it from there.</div>
                  <div className="fieldlabel">Full name</div>
                  <input className="slotinput" placeholder="Your full name" value={form.name} onChange={(event) => setForm({ name: event.target.value })} />
                  <div className="fieldlabel">Service address</div>
                  <input className="slotinput" placeholder="Where the work will happen" value={form.address} onChange={(event) => setForm({ address: event.target.value })} />
                  <div className="fieldlabel">Email</div>
                  <input className="slotinput" type="email" placeholder="you@email.com" value={form.email} onChange={(event) => setForm({ email: event.target.value })} />
                  <div className="fieldlabel">Phone (optional)</div>
                  <input className="slotinput" type="tel" placeholder="(555) 555-5555" value={form.phone} onChange={(event) => setForm({ phone: event.target.value })} />
                  <button className="primary" onClick={() => submitHandoff(thread)} disabled={busy || !form.name.trim() || !form.address.trim() || !form.email.trim()}>{busy ? 'Sending…' : 'Send my details'}</button>
                  {handoffError[thread.thread_id] && <div style={{ marginTop: 12, color: '#B42318', fontSize: 14, fontWeight: 700 }}>{handoffError[thread.thread_id]}</div>}
                </div></div>
              )}
              {hero}
              {showConvo && (
                <div className="sec"><div className="card">
                  {unanswered && <div className="eyebrow">Message from {name}</div>}
                  <div style={{ fontWeight: 800, fontSize: 18, marginTop: unanswered ? 8 : 0 }}>Messages with {name}</div>
                  {textMessages.length > 0 && (
                    <div className="convo">
                      {textMessages.map((message, index) => {
                        const mine = message.sender === 'homeowner'
                        return (
                          <div className={`msg${mine ? ' mine' : ''}`} key={index}>
                            <div className="msgmeta">{mine ? 'You' : name}{message.created_at ? ` · ${relativeTime(message.created_at)}` : ''}</div>
                            {message.kind === 'photo' && message.meta?.url ? (
                              <img
                                src={message.meta.url || "/placeholder.svg"}
                                alt={`Photo from ${mine ? 'you' : name}`}
                                style={{ maxWidth: 240, borderRadius: 15, cursor: 'pointer', display: 'block' }}
                                onClick={() => window.open(message.meta!.url, '_blank', 'noopener,noreferrer')}
                              />
                            ) : (
                              <div className="msgbubble">{message.body}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <input
                    className="slotinput"
                    style={{ marginTop: 16 }}
                    placeholder={`Message ${name}…`}
                    value={replyText[thread.thread_id] ?? ''}
                    onChange={(event) => { setReplyText((current) => ({ ...current, [thread.thread_id]: event.target.value })); setJustSent((current) => ({ ...current, [thread.thread_id]: false })) }}
                    onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void sendReply(thread.thread_id) } }}
                  />
                  <button className="primary" onClick={() => sendReply(thread.thread_id)} disabled={busy || !replyText[thread.thread_id]?.trim()}>{busy ? 'Sending…' : 'Send'}</button>
                  <button className="secondary" onClick={() => fileRefs.current[thread.thread_id]?.click()} disabled={uploadingThread === thread.thread_id}>{uploadingThread === thread.thread_id ? 'Uploading…' : '📷 Add photo'}</button>
                  <input
                    ref={(element) => { fileRefs.current[thread.thread_id] = element }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPhoto(thread.thread_id, file); event.target.value = '' }}
                  />
                  {photoError[thread.thread_id] && <div style={{ marginTop: 8, color: '#B42318', fontSize: 13, fontWeight: 700 }}>{photoError[thread.thread_id]}</div>}
                  {justSent[thread.thread_id] && <div className="sentline">Sent ✓</div>}
                </div></div>
              )}
            </Fragment>
          )
        })}
        </div>

        <div className="sec"><details className="card details" open>
          <summary>Project details</summary>
          {job.description && <div className="detailrow"><span>Details</span><strong>{job.description}</strong></div>}
          {job.urgency && <div className="detailrow"><span>Timeline</span><strong>{humanizeUrgency(job.urgency)}</strong></div>}
          {job.location && <div className="detailrow"><span>Location</span><strong>{job.location}</strong></div>}
          {job.category && <div className="detailrow"><span>Category</span><strong>{job.category}</strong></div>}
        </details></div>

        <footer className="footer">
          <HomeBidsLogo size="20px" />
          <div>
            <a className="help" href={`sms:${HB_PHONE}`}>Need help? Reply to our text.</a>
            <div>© 2026 HomeBids.ai</div>
          </div>
        </footer>
      </div>
      <div className={`toast${toast ? ' on' : ''}`} role="status" aria-live="polite">{toast}</div>
    </main>
  )
}
