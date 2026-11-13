import { z } from "zod";
import { leadSchema, type LeadInput, type LeadResult } from "@/lib/lead-schema";
import { submitLeadFunction } from "@/lib/submit-lead.functions";

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, status: 400 };
  try {
    const response = await submitLeadFunction({ data: parsed.data });
    if (!response.ok) return { ok: false, status: response.status };
    const result = z.object({ ok: z.literal(true), id: z.string().uuid().optional() }).safeParse(await response.json());
    if (!result.success) return { ok: false, status: 500 };
    return result.data.id ? { ok: true, id: result.data.id } : { ok: true };
  } catch { return { ok: false, status: 500 }; }
}