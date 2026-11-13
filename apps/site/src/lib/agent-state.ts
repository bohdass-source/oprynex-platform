// Whether the assistant window is open, shared with parts of the page that should hold still
// while the visitor chats (the hero cases stop moving). The widget is root-mounted, so a carousel
// that mounts later reads the current value instead of waiting for the next change.
export const AGENT_STATE_EVENT = "oprynex:agent-state";

let open = false;

export function isAgentOpen() {
  return open;
}

export function setAgentOpen(next: boolean) {
  if (open === next) return;
  open = next;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AGENT_STATE_EVENT));
}
