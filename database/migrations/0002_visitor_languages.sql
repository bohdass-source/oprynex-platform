-- Leads keep the visitor's language: any of the 20 supported chat languages (site UI stays de/ru/en).
ALTER TABLE public.leads DROP CONSTRAINT leads_language_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_language_check CHECK (language IN ('de','en','fr','es','it','nl','pl','pt','ro','cs','hu','bg','el','sv','da','fi','tr','ru','uk','kk'));
