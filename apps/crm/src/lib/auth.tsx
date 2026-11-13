import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { pickWorkspace, rememberWorkspace, rememberedWorkspace, type Role, type Workspace } from "@/lib/crm";
import { supabase } from "@/lib/supabase";

export type AuthState =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "noAccess"; session: Session; signupOpen: boolean }
  | { kind: "ready"; session: Session; workspace: Workspace; workspaces: Workspace[] };

type AuthContextValue = { state: AuthState; reload: () => Promise<void>; switchTo: (id: string) => void };
const AuthContext = createContext<AuthContextValue>({ state: { kind: "loading" }, reload: async () => {}, switchTo: () => {} });

/** Resolves the session (including the sign-in link in the URL), accepts open invitations and loads the member's workspaces. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ kind: "loading" });
  const [session, setSession] = useState<Session | null>(null);

  const resolve = useCallback(async (current: Session | null, active: () => boolean = () => true) => {
    if (!current) { if (active()) setState({ kind: "signedOut" }); return; }
    const client = supabase();
    await client.rpc("accept_my_invites"); // an invitation sent after this account was created
    const [spaces, roles] = await Promise.all([
      client.from("workspaces").select("id, name, plan, status, trial_ends_at").order("created_at"),
      client.from("workspace_members").select("workspace_id, role").eq("user_id", current.user.id),
    ]);
    if (!active()) return;
    const roleOf = new Map((roles.data ?? []).map((m) => [m.workspace_id as string, m.role as Role]));
    const list: Workspace[] = (spaces.data ?? []).flatMap((w) => {
      const role = roleOf.get(w.id as string);
      return role ? [{ ...(w as Omit<Workspace, "role">), role }] : [];
    });
    const chosen = pickWorkspace(list, rememberedWorkspace());
    if (spaces.error || roles.error || !chosen) {
      const open = await client.rpc("cloud_signup_open");
      if (active()) setState({ kind: "noAccess", session: current, signupOpen: open.data === true });
      return;
    }
    setState({ kind: "ready", session: current, workspace: chosen, workspaces: list });
  }, []);

  useEffect(() => {
    const client = supabase();
    let active = true;
    const isActive = () => active;
    void client.auth.getSession().then(({ data }) => { setSession(data.session); return resolve(data.session, isActive); });
    const { data: listener } = client.auth.onAuthStateChange((event, next) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") { setSession(next); void resolve(next, isActive); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [resolve]);

  const reload = useCallback(() => resolve(session), [resolve, session]);
  const switchTo = useCallback((id: string) => {
    rememberWorkspace(id);
    setState((s) => {
      if (s.kind !== "ready") return s;
      const next = s.workspaces.find((w) => w.id === id);
      return next ? { ...s, workspace: next } : s;
    });
  }, []);
  return <AuthContext.Provider value={{ state, reload, switchTo }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext).state;
}

/** Reload after creating a workspace; switch between the person's workspaces. */
export function useAuthActions() {
  const { reload, switchTo } = useContext(AuthContext);
  return { reload, switchTo };
}

/** For screens that only render inside the signed-in shell. */
export function useWorkspace(): { workspace: Workspace; workspaces: Workspace[]; userId: string } {
  const state = useAuth();
  if (state.kind !== "ready") throw new Error("useWorkspace outside a ready session");
  return { workspace: state.workspace, workspaces: state.workspaces, userId: state.session.user.id };
}
