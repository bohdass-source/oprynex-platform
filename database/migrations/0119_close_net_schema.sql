-- Outgoing HTTP from the database is only for the SECURITY DEFINER functions owned by postgres (notify_push, run_monitor).
REVOKE USAGE ON SCHEMA net FROM anon, authenticated;
