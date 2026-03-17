ALTER TABLE public.recipes
  ADD COLUMN calories integer,
  ADD COLUMN protein_g numeric(5,1),
  ADD COLUMN carbs_g numeric(5,1),
  ADD COLUMN fat_g numeric(5,1),
  ADD COLUMN prep_time_min integer,
  ADD COLUMN cook_time_min integer;