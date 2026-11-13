-- 0103 relied on its column grant, but Supabase's default privileges had already given anon and authenticated the whole
-- sites table (as 0100 notes for its own tables). Revoke that, then grant members only the columns without the token hash.
-- accept_site_lead is for client sites (anon) only; signed-in CRM users have no reason to call it.

REVOKE ALL ON public.sites FROM anon, authenticated;
GRANT SELECT (id, workspace_id, created_at, name, url, daily_limit) ON public.sites TO authenticated;
REVOKE ALL ON FUNCTION public.accept_site_lead(text, text, jsonb) FROM authenticated;
