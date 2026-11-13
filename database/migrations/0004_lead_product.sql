-- The product a visitor chose in the form; the CRM's leads.product column already exists and checks the values.
CREATE OR REPLACE FUNCTION public.accept_lead(p_ip_hash text, p_lead jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
 INSERT INTO public.leads(name,email,company,message,source,chat_topic,language,page_path,consent,consent_at,referrer_host,utm_source,utm_medium,utm_campaign,product)
 VALUES(p_lead->>'name',p_lead->>'email',nullif(p_lead->>'company',''),p_lead->>'message',p_lead->>'source',p_lead->>'chatTopic',p_lead->>'language',p_lead->>'pagePath',(p_lead->>'consent')::boolean,ts,p_lead->>'referrerHost',p_lead->>'utmSource',p_lead->>'utmMedium',p_lead->>'utmCampaign',p_lead->>'product')
 RETURNING id INTO lead_id;
 UPDATE public.lead_rate_limits SET accepted_at = array_append(recent,ts), updated_at = ts WHERE ip_hash = p_ip_hash;
 RETURN jsonb_build_object('ok',true,'id',lead_id);
END;
$function$;
