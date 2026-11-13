-- Outage alerts for Oprynex staff. Every 10 minutes the database calls the CRM (POST /api/monitor, same token as the push
-- hook in 0111) with the push endpoints of the platform admins' devices. The CRM checks the Oprynex site and the bot engine
-- through its service bindings and wakes those devices only when one of them is down; the service worker then asks
-- /api/alert and shows "service problem" instead of "new request". A problem that lasts replaces the same notification
-- (one tag), so it does not pile up. Nothing runs when no admin device is registered.

CREATE FUNCTION private.run_monitor() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE hook private.push_hook; targets text[];
BEGIN
 SELECT array_agg(s.endpoint) INTO targets
 FROM public.push_subscriptions s JOIN private.platform_admins a ON a.user_id = s.user_id;
 IF targets IS NULL THEN RETURN; END IF;
 SELECT * INTO hook FROM private.push_hook;
 PERFORM net.http_post(
  url := replace(hook.url, '/api/push', '/api/monitor'),
  body := jsonb_build_object('endpoints', to_jsonb(targets[1:50])),
  headers := jsonb_build_object('content-type', 'application/json', 'x-push-token', hook.token),
  timeout_milliseconds := 20000
 );
END;
$$;
REVOKE ALL ON FUNCTION private.run_monitor() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('oprynex-outage-monitor', '*/10 * * * *', 'SELECT private.run_monitor()');
