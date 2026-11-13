CREATE TABLE public.chat_rate_limits (
  ip_hash text PRIMARY KEY,
  minute_start timestamptz NOT NULL DEFAULT now(),
  minute_count integer NOT NULL DEFAULT 0,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  day_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.chat_daily_usage (
  day date PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 0
);
REVOKE ALL ON public.chat_rate_limits FROM anon, authenticated;
REVOKE ALL ON public.chat_daily_usage FROM anon, authenticated;
GRANT ALL ON public.chat_rate_limits TO service_role;
GRANT ALL ON public.chat_daily_usage TO service_role;
ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.accept_chat_request(p_ip_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
 ts timestamptz := clock_timestamp();
 today date := (clock_timestamp() AT TIME ZONE 'utc')::date;
 r public.chat_rate_limits%ROWTYPE;
 global_count integer;
BEGIN
 INSERT INTO public.chat_rate_limits(ip_hash, minute_start, day) VALUES (p_ip_hash, ts, today) ON CONFLICT DO NOTHING;
 SELECT * INTO r FROM public.chat_rate_limits WHERE ip_hash = p_ip_hash FOR UPDATE;
 IF r.minute_start <= ts - interval '1 minute' THEN r.minute_start := ts; r.minute_count := 0; END IF;
 IF r.day <> today THEN r.day := today; r.day_count := 0; END IF;
 IF r.minute_count >= 10 OR r.day_count >= 60 THEN RETURN jsonb_build_object('ok',false,'limited',true); END IF;
 INSERT INTO public.chat_daily_usage(day) VALUES (today) ON CONFLICT DO NOTHING;
 SELECT request_count INTO global_count FROM public.chat_daily_usage WHERE day = today FOR UPDATE;
 IF global_count >= 1500 THEN RETURN jsonb_build_object('ok',false,'capacity',true); END IF;
 UPDATE public.chat_daily_usage SET request_count = request_count + 1 WHERE day = today;
 UPDATE public.chat_rate_limits SET minute_start = r.minute_start, minute_count = r.minute_count + 1, day = r.day, day_count = r.day_count + 1, updated_at = ts WHERE ip_hash = p_ip_hash;
 RETURN jsonb_build_object('ok',true);
END;
$function$;
REVOKE ALL ON FUNCTION public.accept_chat_request(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_chat_request(text) TO service_role;