-- Link named administrator sessions to their existing account.
-- Safe to run again; existing account and reservation rows are preserved.
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.admins(id);

NOTIFY pgrst, 'reload schema';
