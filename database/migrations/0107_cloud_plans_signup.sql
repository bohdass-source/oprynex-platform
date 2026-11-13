-- Oprynex Cloud, stage 1: plans, a 14 day trial, self sign-up (closed until the owner opens it) and the Oprynex admin view.
-- Plans and user limits match the site's /preise (oprynex-site src/lib/offers.ts: Start 2, Team 5, Business 12 users).
-- 'internal' is for Oprynex's own and hand-made client workspaces: no limit, no trial.
-- Billing comes later with Stripe; until then the Oprynex admin sets plan and status by hand.

ALTER TABLE public.workspaces
 ADD COLUMN plan text NOT NULL DEFAULT 'internal' CHECK (plan IN ('internal','start','team','business')),
 ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('trial','active','paused')),
 ADD COLUMN trial_ends_at timestamptz,
 ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Oprynex staff who see every workspace in the admin view. Only reachable through the functions below.
CREATE TABLE private.platform_admins (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
INSERT INTO private.platform_admins(user_id) SELECT user_id FROM public.workspace_members WHERE workspace_id = '00000000-0000-4000-8000-000000000001' AND role = 'owner';
-- One switch for self sign-up; closed until AGB, Datenschutz and AVV for Cloud are published.
CREATE TABLE private.cloud_settings (id boolean PRIMARY KEY DEFAULT true CHECK (id), signup_open boolean NOT NULL DEFAULT false);
INSERT INTO private.cloud_settings DEFAULT VALUES;
REVOKE ALL ON private.platform_admins, private.cloud_settings FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM private.platform_admins WHERE user_id = (SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION private.is_platform_admin() FROM PUBLIC, anon, authenticated;

CREATE FUNCTION private.plan_user_limit(p_plan text) RETURNS integer
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
 SELECT CASE p_plan WHEN 'start' THEN 2 WHEN 'team' THEN 5 WHEN 'business' THEN 12 ELSE NULL END;
$$;

-- Seats: members plus open invitations may not exceed the plan; the Start plan has no admin role ("Rollen" begins with Team).
CREATE FUNCTION private.check_plan_seats() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 w public.workspaces;
 seats integer;
BEGIN
 SELECT * INTO w FROM public.workspaces WHERE id = NEW.workspace_id;
 IF w.plan = 'start' AND NEW.role = 'admin' THEN
  RAISE EXCEPTION 'plan_no_admin' USING ERRCODE = 'P0001', HINT = 'The Start plan has owner and member roles only';
 END IF;
 IF TG_TABLE_NAME = 'workspace_invites' AND private.plan_user_limit(w.plan) IS NOT NULL THEN
  SELECT (SELECT count(*) FROM public.workspace_members m WHERE m.workspace_id = w.id)
       + (SELECT count(*) FROM public.workspace_invites i WHERE i.workspace_id = w.id) INTO seats;
  IF seats >= private.plan_user_limit(w.plan) THEN
   RAISE EXCEPTION 'plan_user_limit' USING ERRCODE = 'P0001', HINT = 'All seats of the plan are taken';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.check_plan_seats() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER invites_plan_seats BEFORE INSERT ON public.workspace_invites FOR EACH ROW EXECUTE FUNCTION private.check_plan_seats();
CREATE TRIGGER members_plan_role BEFORE INSERT OR UPDATE OF role ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION private.check_plan_seats();

-- Whether a signed-in person without a workspace may create one.
CREATE FUNCTION public.cloud_signup_open() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT (SELECT signup_open FROM private.cloud_settings) OR private.is_platform_admin();
$$;

-- Self sign-up: creates the caller's company workspace on a 14 day trial and makes the caller its owner.
-- One self-made workspace per person (Oprynex admins may create more, e.g. for a client).
CREATE FUNCTION public.create_workspace(p_name text, p_plan text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 me uuid := auth.uid();
 ws uuid;
BEGIN
 IF me IS NULL THEN RAISE EXCEPTION 'not_signed_in' USING ERRCODE = '42501'; END IF;
 IF NOT public.cloud_signup_open() THEN RAISE EXCEPTION 'signup_closed' USING ERRCODE = 'P0001'; END IF;
 IF p_plan NOT IN ('start','team','business') THEN RAISE EXCEPTION 'bad_plan' USING ERRCODE = '22023'; END IF;
 IF char_length(trim(coalesce(p_name, ''))) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'bad_name' USING ERRCODE = '22023'; END IF;
 IF NOT private.is_platform_admin() AND EXISTS (SELECT 1 FROM public.workspaces WHERE created_by = me) THEN
  RAISE EXCEPTION 'already_created' USING ERRCODE = 'P0001';
 END IF;
 INSERT INTO public.workspaces(name, plan, status, trial_ends_at, created_by)
 VALUES (trim(p_name), p_plan, 'trial', now() + interval '14 days', me) RETURNING id INTO ws;
 INSERT INTO public.workspace_members(workspace_id, user_id, role) VALUES (ws, me, 'owner');
 RETURN ws;
END;
$$;

-- Invitations used to turn into memberships only on a person's very first sign-in. This lets someone who already
-- has an account (for example from a trial of their own) accept an invitation to another workspace.
CREATE FUNCTION public.accept_my_invites() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 me uuid := auth.uid();
 mail text := lower(coalesce(auth.jwt()->>'email', ''));
 n integer;
BEGIN
 IF me IS NULL OR mail = '' THEN RETURN 0; END IF;
 INSERT INTO public.workspace_members(workspace_id, user_id, role)
 SELECT i.workspace_id, me, i.role FROM public.workspace_invites i WHERE i.email = mail
 ON CONFLICT (workspace_id, user_id) DO NOTHING;
 GET DIAGNOSTICS n = ROW_COUNT;
 DELETE FROM public.workspace_invites WHERE email = mail;
 RETURN n;
END;
$$;

-- Oprynex admin view: every workspace with plan, status, trial end, seats and requests.
CREATE FUNCTION public.platform_workspaces() RETURNS TABLE (id uuid, name text, created_at timestamptz, plan text, status text, trial_ends_at timestamptz, owner_email text, members integer, invites integer, leads integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'not_platform_admin' USING ERRCODE = '42501'; END IF;
 RETURN QUERY
 SELECT w.id, w.name, w.created_at, w.plan, w.status, w.trial_ends_at,
  (SELECT u.email::text FROM public.workspace_members m JOIN auth.users u ON u.id = m.user_id WHERE m.workspace_id = w.id AND m.role = 'owner' ORDER BY m.created_at LIMIT 1),
  (SELECT count(*)::integer FROM public.workspace_members m WHERE m.workspace_id = w.id),
  (SELECT count(*)::integer FROM public.workspace_invites i WHERE i.workspace_id = w.id),
  (SELECT count(*)::integer FROM public.leads l WHERE l.workspace_id = w.id)
 FROM public.workspaces w ORDER BY w.created_at;
END;
$$;

CREATE FUNCTION public.platform_update_workspace(p_id uuid, p_plan text, p_status text, p_trial_ends_at timestamptz) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'not_platform_admin' USING ERRCODE = '42501'; END IF;
 UPDATE public.workspaces SET plan = p_plan, status = p_status, trial_ends_at = p_trial_ends_at WHERE id = p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002'; END IF;
END;
$$;

CREATE FUNCTION public.platform_settings() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT private.is_platform_admin() THEN RETURN NULL; END IF;
 RETURN (SELECT jsonb_build_object('signupOpen', signup_open) FROM private.cloud_settings);
END;
$$;

CREATE FUNCTION public.platform_set_signup(p_open boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT private.is_platform_admin() THEN RAISE EXCEPTION 'not_platform_admin' USING ERRCODE = '42501'; END IF;
 UPDATE private.cloud_settings SET signup_open = p_open;
END;
$$;

REVOKE ALL ON FUNCTION public.cloud_signup_open(), public.create_workspace(text, text), public.accept_my_invites(), public.platform_workspaces(),
 public.platform_update_workspace(uuid, text, text, timestamptz), public.platform_settings(), public.platform_set_signup(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cloud_signup_open(), public.create_workspace(text, text), public.accept_my_invites(), public.platform_workspaces(),
 public.platform_update_workspace(uuid, text, text, timestamptz), public.platform_settings(), public.platform_set_signup(boolean) TO authenticated;
