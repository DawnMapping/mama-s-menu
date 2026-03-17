
-- Profiles for individual nutrition tracking
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  daily_calories_target integer DEFAULT 2000,
  daily_protein_g_target integer DEFAULT 100,
  daily_carbs_g_target integer DEFAULT 250,
  daily_fat_g_target integer DEFAULT 65,
  avatar_emoji text DEFAULT '👤',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete profiles" ON public.profiles FOR DELETE USING (true);

-- Seed the three family members
INSERT INTO public.profiles (name, avatar_emoji, daily_calories_target, daily_protein_g_target)
VALUES
  ('Michael', '👨‍🍳', 2200, 120),
  ('Mum', '👩', 1800, 90),
  ('Stepdad', '👨', 2000, 100);
