-- Oprynex Cloud, stage 5: integrations follow the plan (site /preise: "Integrationen" only in Business).
-- Website chatbots need a workspace on Business or Oprynex's internal plan that is not paused. Creating or switching on a
-- bot is refused otherwise, and the engine stops serving a bot whose workspace was moved to a smaller plan or paused
-- (the engine reads the settings through bot_engine_config before every answer and every request form).
-- Website forms (public.sites) are set up by Oprynex as part of a website project and stay independent of the plan.

CREATE FUNCTION private.workspace_has_integrations(p_ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = p_ws AND w.plan IN ('internal','business') AND w.status <> 'paused');
$$;
REVOKE ALL ON FUNCTION private.workspace_has_integrations(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.workspace_has_integrations(uuid) TO authenticated;

ALTER POLICY bots_insert ON public.bots
 WITH CHECK ((SELECT private.is_workspace_admin(workspace_id)) AND private.workspace_has_integrations(workspace_id));
ALTER POLICY bots_update ON public.bots
 WITH CHECK ((SELECT private.is_workspace_admin(workspace_id)) AND (NOT enabled OR private.workspace_has_integrations(workspace_id)));

CREATE OR REPLACE FUNCTION public.bot_engine_config(p_token text, p_bot uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE b public.bots;
BEGIN
 IF NOT coalesce(private.bot_engine_ok(p_token), false) THEN RETURN NULL; END IF;
 SELECT * INTO b FROM public.bots WHERE id = p_bot AND enabled;
 IF b.id IS NULL OR NOT private.workspace_has_integrations(b.workspace_id) THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id', b.id, 'name', b.name, 'business', b.business, 'origins', to_jsonb(b.origins), 'languages', to_jsonb(b.languages),
  'greeting', b.greeting, 'knowledge', b.knowledge, 'quickReplies', to_jsonb(b.quick_replies), 'color', b.color, 'privacyUrl', b.privacy_url);
END;
$$;
