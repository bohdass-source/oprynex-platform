-- Oprynex Cloud: the owner sets up a client's company personally (the site promises that access is set up personally
-- while online sign-up is closed). An Oprynex admin creates the company with a plan and invites the client's email as
-- its owner; the client signs in at the CRM with that email and accept_my_invites makes them the owner. The admin does
-- not become a member, and created_by stays empty so the client can never be blocked by the one-company rule.

CREATE FUNCTION public.platform_create_workspace(p_name text, p_plan text, p_owner_email text, p_trial_days integer) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE ws uuid; mail text := lower(trim(coalesce(p_owner_email, '')));
BEGIN
 IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'not_platform_admin' USING ERRCODE = '42501'; END IF;
 IF p_plan NOT IN ('start','team','business') THEN RAISE EXCEPTION 'bad_plan' USING ERRCODE = '22023'; END IF;
 IF char_length(trim(coalesce(p_name, ''))) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'bad_name' USING ERRCODE = '22023'; END IF;
 IF mail !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' OR char_length(mail) > 255 THEN RAISE EXCEPTION 'bad_email' USING ERRCODE = '22023'; END IF;
 IF p_trial_days IS NULL OR p_trial_days NOT BETWEEN 0 AND 60 THEN RAISE EXCEPTION 'bad_trial' USING ERRCODE = '22023'; END IF;
 INSERT INTO public.workspaces(name, plan, status, trial_ends_at, created_by)
 VALUES (trim(p_name), p_plan, CASE WHEN p_trial_days > 0 THEN 'trial' ELSE 'active' END,
  CASE WHEN p_trial_days > 0 THEN now() + make_interval(days => p_trial_days) END, NULL)
 RETURNING id INTO ws;
 INSERT INTO public.workspace_invites(workspace_id, email, role) VALUES (ws, mail, 'owner');
 RETURN ws;
END;
$$;
REVOKE ALL ON FUNCTION public.platform_create_workspace(text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_create_workspace(text, text, text, integer) TO authenticated;
