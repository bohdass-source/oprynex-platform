-- Oprynex Cloud: data protection a company can use on its own (DSGVO Art. 17 and 20, storage limitation in Art. 5).
-- 1. Retention: owners and admins choose after how many months lost and spam requests and closed tickets are deleted.
-- 2. Deleting the company: the owner deletes the workspace with every request, ticket, form, bot and member (all foreign
--    keys cascade). Oprynex's own internal workspace cannot be deleted this way.
-- 3. A daily job (pg_cron, 03:17 UTC) applies the retention and removes rate-limit rows older than 7 days: they hold only
--    hashes of IP addresses and exist to stop abuse. The 7 days are the owner's default until the lawyer confirms a period.
--    This includes the Oprynex site's chat_rate_limits (the site repo owns the table; only stale rows are removed).

CREATE EXTENSION IF NOT EXISTS pg_cron;

ALTER TABLE public.workspaces ADD COLUMN retention_months smallint CHECK (retention_months BETWEEN 3 AND 120);

-- Owners and admins set or clear the retention; null keeps everything until it is deleted by hand.
CREATE FUNCTION public.set_retention(p_ws uuid, p_months smallint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT coalesce(private.is_workspace_admin(p_ws), false) THEN RAISE EXCEPTION 'not_admin' USING ERRCODE = '42501'; END IF;
 IF p_months IS NOT NULL AND p_months NOT BETWEEN 3 AND 120 THEN RAISE EXCEPTION 'retention_range' USING ERRCODE = '22023'; END IF;
 UPDATE public.workspaces SET retention_months = p_months WHERE id = p_ws;
END;
$$;

-- Members read their company's retention (the workspaces select policy already limits rows to members).
GRANT SELECT (retention_months) ON public.workspaces TO authenticated;

-- The owner deletes the company. The exact company name must be typed, so a click alone never deletes anything.
CREATE FUNCTION public.delete_workspace(p_ws uuid, p_confirm text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE w public.workspaces;
BEGIN
 SELECT * INTO w FROM public.workspaces WHERE id = p_ws FOR UPDATE;
 IF w.id IS NULL OR NOT EXISTS (SELECT 1 FROM public.workspace_members m WHERE m.workspace_id = p_ws AND m.user_id = auth.uid() AND m.role = 'owner') THEN
  RAISE EXCEPTION 'not_owner' USING ERRCODE = '42501';
 END IF;
 IF w.plan = 'internal' THEN RAISE EXCEPTION 'internal_workspace' USING ERRCODE = '42501'; END IF;
 IF p_confirm IS DISTINCT FROM w.name THEN RAISE EXCEPTION 'confirm_name' USING ERRCODE = '22023'; END IF;
 DELETE FROM public.workspaces WHERE id = p_ws;
END;
$$;

REVOKE ALL ON FUNCTION public.set_retention(uuid, smallint), public.delete_workspace(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_retention(uuid, smallint), public.delete_workspace(uuid, text) TO authenticated;

CREATE FUNCTION private.daily_cleanup() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE leads_gone integer; tickets_gone integer; limits_gone integer := 0; n integer;
BEGIN
 DELETE FROM public.leads l USING public.workspaces w
  WHERE l.workspace_id = w.id AND w.retention_months IS NOT NULL AND l.status IN ('lost','spam')
   AND l.updated_at < now() - make_interval(months => w.retention_months);
 GET DIAGNOSTICS leads_gone = ROW_COUNT;
 DELETE FROM public.tickets t USING public.workspaces w
  WHERE t.workspace_id = w.id AND w.retention_months IS NOT NULL AND t.status = 'closed'
   AND t.updated_at < now() - make_interval(months => w.retention_months);
 GET DIAGNOSTICS tickets_gone = ROW_COUNT;
 DELETE FROM public.lead_rate_limits WHERE updated_at < now() - interval '7 days';
 GET DIAGNOSTICS n = ROW_COUNT; limits_gone := limits_gone + n;
 DELETE FROM public.chat_rate_limits WHERE updated_at < now() - interval '7 days';
 GET DIAGNOSTICS n = ROW_COUNT; limits_gone := limits_gone + n;
 DELETE FROM private.bot_visitor_limits WHERE day < (now() AT TIME ZONE 'utc')::date - 7 AND minute_start < now() - interval '7 days'
  AND NOT EXISTS (SELECT 1 FROM unnest(leads) AS x WHERE x > now() - interval '7 days');
 GET DIAGNOSTICS n = ROW_COUNT; limits_gone := limits_gone + n;
 RETURN jsonb_build_object('leads', leads_gone, 'tickets', tickets_gone, 'limits', limits_gone);
END;
$$;
REVOKE ALL ON FUNCTION private.daily_cleanup() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('oprynex-daily-cleanup', '17 3 * * *', 'SELECT private.daily_cleanup()');
