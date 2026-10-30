"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Homeowner questions on a contractor's bids (Tim, Oct 29: "it's showing me a question asked, but it doesn't tell me
 * what the question asked is ... Shouldn't it open the private link that contains the chat between homeowner contractor?").
 *
 * Two kinds exist (see dpaj my_bid_questions / answer_bid_question):
 *  - "thread": a marketplace bid - the question is a message in the private contractor thread; the chat is /c/<c_token>.
 *  - "text":   an own-customer bid - the question came in by text relay (pending_questions); the dashboard shows the same
 *              conversation and answerBidQuestion() replies exactly the way Bid Builder's text relay does.
 */

export interface BidQA {
  id: string;
  question: string | null; // "" when the row is a contractor follow-up with nothing open
  answer: string | null;
  status: string; // open | answered | expired | superseded
  asked_at: string;
  answered_at: string | null;
}

export interface BidQuestion {
  share_token: string;
  kind: "thread" | "text";
  c_token: string | null;
  question: string | null; // latest homeowner question
  asked_at: string | null;
  last_sender: "homeowner" | "contractor" | "system" | string | null;
  history: BidQA[] | null; // text kind only
}

type Result<T> = { data: T; error: null } | { data: null; error: string };

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<Result<T>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data, error } = await supabase.rpc(fn, args ?? {});
  if (error) return { data: null, error: error.message };
  return { data: data as T, error: null };
}

/** Every bid of the signed-in contractor that has a homeowner question/conversation. */
export async function getMyBidQuestions(): Promise<Result<BidQuestion[]>> {
  const res = await rpc<BidQuestion[] | null>("my_bid_questions");
  if (res.error !== null) return res;
  return { data: Array.isArray(res.data) ? res.data : [], error: null };
}

/** Reply to an own-customer bid question: texts the homeowner, marks the question answered, clears "Question asked". */
export async function answerBidQuestion(shareToken: string, answer: string): Promise<Result<{ ok: boolean; error?: string }>> {
  return rpc<{ ok: boolean; error?: string }>("answer_bid_question", { p_share_token: shareToken, p_answer: answer });
}
