"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * PHONECHANGE (Abir, Nov 8: "we need a system that user can change his number" — Danny Gomez's office line bounced every
 * Lead Radar / Bid Builder text): a contractor changes the mobile number on his account from the Account page.
 *
 *   requestPhoneChange(number)  -> we text a 6-digit code to the NEW number from the HomeBids line (notify_outbox)
 *   phoneChangeStatus(request)  -> pending | sent | failed | expired | verified  (failed = Sendblue could not deliver: not a mobile)
 *   confirmPhoneChange(req, code) -> profiles.phone becomes +1XXXXXXXXXX; the Bid Builder and Lead Radar use it from then on
 *
 * Rules live in the dpaj RPCs: 10-digit US number, not another contractor's number, 3 codes/hour, 10-minute code, 5 tries.
 */

export type Result<T> = { data: T; error: null } | { data: null; error: string };

export interface PhoneChangeRequest {
  ok: boolean;
  same?: boolean; // the number is already the one on the account - nothing to confirm
  request_id?: string;
  phone: string; // E.164
}

export type PhoneChangeState = "pending" | "sent" | "failed" | "expired" | "verified";

export interface PhoneChangeStatus {
  status: PhoneChangeState;
  attempts: number;
  phone: string;
}

export interface PhoneChangeConfirm {
  ok: boolean;
  phone?: string;
  error?: string; // wrong code (returned, not thrown, so the try counter sticks)
  tries_left?: number;
}

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

export async function requestPhoneChange(phone: string): Promise<Result<PhoneChangeRequest>> {
  return rpc<PhoneChangeRequest>("request_phone_change", { p_phone: String(phone ?? "").trim() });
}

export async function phoneChangeStatus(requestId: string): Promise<Result<PhoneChangeStatus | null>> {
  return rpc<PhoneChangeStatus | null>("phone_change_status", { p_request: requestId });
}

export async function confirmPhoneChange(requestId: string, code: string): Promise<Result<PhoneChangeConfirm>> {
  return rpc<PhoneChangeConfirm>("confirm_phone_change", { p_request: requestId, p_code: String(code ?? "").trim() });
}
