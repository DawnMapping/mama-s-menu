
-- Storage bucket for book files (PDFs/EPUBs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true);

-- Allow public read access to books bucket
CREATE POLICY "Anyone can read books"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'books');

-- Allow public upload to books bucket
CREATE POLICY "Anyone can upload books"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'books');

-- Allow public delete from books bucket
CREATE POLICY "Anyone can delete books"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'books');

-- Books metadata table
CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  book_source text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read books" ON public.books FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert books" ON public.books FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete books" ON public.books FOR DELETE TO public USING (true);

-- Shopping list items table (auto-generated from locked meals)
CREATE TABLE public.shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient text NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  meal_day text,
  checked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shopping items" ON public.shopping_list_items FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert shopping items" ON public.shopping_list_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update shopping items" ON public.shopping_list_items FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete shopping items" ON public.shopping_list_items FOR DELETE TO public USING (true);
