// Saved table views: a name plus the filters of the requests table, remembered in this browser.
export type LeadSearch = { q?: string | undefined; status?: string | undefined; product?: string | undefined; source?: string | undefined; owner?: string | undefined };
export type SavedView = { name: string; search: LeadSearch };

const KEY = "oprynex-app-views";

export function readViews(): SavedView[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is SavedView => typeof v?.name === "string" && typeof v?.search === "object" && v.search !== null).slice(0, 20);
  } catch { return []; }
}

/** Saves under a name; a view with the same name is replaced. Returns the new list. */
export function saveView(views: SavedView[], view: SavedView): SavedView[] {
  const next = [...views.filter((v) => v.name !== view.name), view].slice(-20);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: kept for this visit only */ }
  return next;
}

export function deleteView(views: SavedView[], name: string): SavedView[] {
  const next = views.filter((v) => v.name !== name);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}
