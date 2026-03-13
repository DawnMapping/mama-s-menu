CREATE TABLE public.extraction_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  progress int NOT NULL DEFAULT 0,
  result_count int,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.extraction_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read extraction_jobs" ON public.extraction_jobs FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert extraction_jobs" ON public.extraction_jobs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update extraction_jobs" ON public.extraction_jobs FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete extraction_jobs" ON public.extraction_jobs FOR DELETE TO public USING (true);