"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Contact form (footer popup) — server side.
 * Storage + owner alert both happen inside the SECURITY DEFINER RPC
 * `submit_contact_message`; the browser never touches the table directly.
 */
export async function submitContactMessage(input: {
  type: "homeowner" | "contractor";
  name: string;
  email?: string;
  phone?: string;
  message: string;
}): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_contact_message", {
      p_type: input.type,
      p_name: input.name,
      p_email: input.email ?? "",
      p_phone: input.phone ?? "",
      p_message: input.message,
    });
    if (error) return { ok: false };
    return { ok: data === true };
  } catch {
    return { ok: false };
  }
}
