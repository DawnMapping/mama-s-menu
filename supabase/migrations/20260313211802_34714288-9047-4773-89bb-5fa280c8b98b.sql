
-- Create recipes table
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  book_source TEXT,
  page_reference TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'green' CHECK (status IN ('green', 'yellow', 'red')),
  warnings TEXT[] DEFAULT '{}',
  banned_ingredients_found TEXT[] DEFAULT '{}',
  ingredients TEXT,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create locked_meals table
CREATE TABLE public.locked_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  warnings_at_lock TEXT[] DEFAULT '{}',
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_meals ENABLE ROW LEVEL SECURITY;

-- Since no auth needed, allow all access for now
CREATE POLICY "Anyone can read recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recipes" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update recipes" ON public.recipes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete recipes" ON public.recipes FOR DELETE USING (true);

CREATE POLICY "Anyone can read locked_meals" ON public.locked_meals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert locked_meals" ON public.locked_meals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update locked_meals" ON public.locked_meals FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete locked_meals" ON public.locked_meals FOR DELETE USING (true);
