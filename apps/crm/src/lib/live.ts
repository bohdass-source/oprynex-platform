import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Lead } from "@/lib/crm";
import { keys, ticketKeys, useLeads } from "@/lib/queries";
import type { Ticket } from "@/lib/crm";
import { pushIsOn } from "@/lib/push-client";
import { supabase } from "@/lib/supabase";

// New requests reach the owner only inside the CRM: the open app checks for them on its own,
// counts them in the tab title and, if this browser allows it, shows a system notification.

/** How often the open app asks whether a newer request exists (one id, so it costs next to nothing). */
export const PROBE_MS = 15_000;

/** "(3) Oprynex CRM" while 3 requests are new; the plain title otherwise. */
export function titleWithCount(title: string, count: number): string {
  const base = title.replace(/^\(\d+\)\s*/, "");
  return count > 0 ? `(${count}) ${base}` : base;
}

/** Requests that were not in the list before; none on the first load, so opening the app never fires a burst. */
export function arrivals(known: Set<string> | null, leads: Lead[]): Lead[] {
  if (!known) return [];
  return leads.filter((lead) => !known.has(lead.id) && lead.status === "new");
}

export type AlertPermission = "default" | "granted" | "denied" | "unsupported";

function readPermission(): AlertPermission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

/** Browser notifications for this device: the owner turns them on once, the browser remembers the choice. */
export function useAlertPermission() {
  const [permission, setPermission] = useState<AlertPermission>("unsupported");
  useEffect(() => setPermission(readPermission()), []);
  const request = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  }, []);
  return { permission, request };
}

/**
 * Keeps the request list current while the CRM is open: every PROBE_MS it reads the id of the newest request
 * and reloads the list only when that id is unknown. Shows the count of new requests in the tab title and
 * a system notification for each arrival while the tab is in the background.
 */
export function useLiveRequests(workspaceId: string, texts: { title: string; arrival: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const leads = useLeads(workspaceId);
  const known = useRef<Set<string> | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { known.current = null; }, [workspaceId]); // another workspace starts without arrivals

  useEffect(() => {
    let stopped = false;
    const probe = async () => {
      const { data, error } = await supabase().from("leads").select("id").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(1);
      const newest = data?.[0]?.id;
      if (stopped || error || !newest) return;
      const list = qc.getQueryData<Lead[]>(keys.leads(workspaceId));
      if (list && !list.some((lead) => lead.id === newest)) void qc.invalidateQueries({ queryKey: keys.leads(workspaceId) });
      // Tickets too: someone in the team may have opened one, so the bell and the list stay current.
      const tickets = qc.getQueryData<Ticket[]>(ticketKeys.list(workspaceId));
      if (!tickets) return;
      const latest = await supabase().from("tickets").select("id, updated_at").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(1);
      const top = latest.data?.[0];
      if (!stopped && top && !tickets.some((t) => t.id === top.id && t.updated_at === top.updated_at)) void qc.invalidateQueries({ queryKey: ticketKeys.list(workspaceId) });
    };
    const timer = window.setInterval(() => void probe(), PROBE_MS);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [qc, workspaceId]);

  useEffect(() => {
    if (!leads.data) return;
    const fresh = arrivals(known.current, leads.data);
    known.current = new Set(leads.data.map((lead) => lead.id));
    if (!fresh.length || readPermission() !== "granted" || document.visibilityState === "visible" || pushIsOn()) return; // push already tells this device
    for (const lead of fresh.slice(0, 3)) {
      const note = new Notification(texts.arrival, { body: [lead.name, lead.company].filter(Boolean).join(" · "), tag: lead.id, icon: "/emblem.jpg" });
      note.onclick = () => { window.focus(); void navigate({ to: "/leads/$id", params: { id: lead.id } }); note.close(); };
    }
  }, [leads.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const count = (leads.data ?? []).filter((lead) => lead.status === "new").length;
  // path: a navigation rewrites the head title, so the count is put back after every page change.
  useEffect(() => { document.title = titleWithCount(texts.title, count); }, [count, texts.title, path]);
}
