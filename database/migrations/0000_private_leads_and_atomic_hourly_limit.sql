CREATE TABLE public.leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
 email text NOT NULL CHECK (char_length(email) BETWEEN 1 AND 255),
 company text CHECK (char_length(company) <= 150),
 message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
 source text NOT NULL CHECK (source IN ('contact_form','chat_lead','chat_handoff')),
 chat_topic text CHECK (char_length(chat_topic) <= 50),
 language text NOT NULL CHECK (language IN ('de','ru','en')),
 page_path text CHECK (char_length(page_path) <= 200),
 consent boolean NOT NULL CHECK (consent = true),
 consent_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','done','spam'))
);
GRANT ALL ON public.leads TO service_role;
REVOKE ALL ON public.leads FROM anon, authenticated;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.lead_rate_limits (
 ip_hash text PRIMARY KEY CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
 accepted_at timestamptz[] NOT NULL DEFAULT '{}',
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.lead_rate_limits TO service_role;
REVOKE ALL ON public.lead_rate_limits FROM anon, authenticated;
ALTER TABLE public.lead_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.accept_lead(p_ip_hash text, p_lead jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
 recent timestamptz[];
 lead_id uuid;
 ts timestamptz := clock_timestamp();
BEGIN
 INSERT INTO public.lead_rate_limits(ip_hash) VALUES (p_ip_hash) ON CONFLICT DO NOTHING;
 SELECT accepted_at INTO recent FROM public.lead_rate_limits WHERE ip_hash = p_ip_hash FOR UPDATE;
 ts := clock_timestamp();
 SELECT coalesce(array_agg(t), '{}'::timestamptz[]) INTO recent FROM unnest(recent) AS t WHERE t > ts - interval '1 hour';
 IF cardinality(recent) >= 5 THEN RETURN jsonb_build_object('ok',false,'limited',true); END IF;
 INSERT INTO public.leads(name,email,company,message,source,chat_topic,language,page_path,consent,consent_at)
 VALUES(p_lead->>'name',p_lead->>'email',nullif(p_lead->>'company',''),p_lead->>'message',p_lead->>'source',p_lead->>'chatTopic',p_lead->>'language',p_lead->>'pagePath',(p_lead->>'consent')::boolean,ts)
 RETURNING id INTO lead_id;
 UPDATE public.lead_rate_limits SET accepted_at = array_append(recent,ts), updated_at = ts WHERE ip_hash = p_ip_hash;
 RETURN jsonb_build_object('ok',true,'id',lead_id);
END;
$$;
REVOKE ALL ON FUNCTION public.accept_lead(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_lead(text,jsonb) TO service_role;