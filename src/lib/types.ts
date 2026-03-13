export interface Recipe {
  id: string;
  title: string;
  book_source: string | null;
  page_reference: string | null;
  image_url: string | null;
  status: string;
  warnings: string[] | null;
  banned_ingredients_found: string[] | null;
  ingredients: string | null;
  instructions: string | null;
  created_at: string;
}

export interface LockedMeal {
  id: string;
  recipe_id: string;
  day: string;
  locked_at: string;
  warnings_at_lock: string[] | null;
  notes: string | null;
  recipes?: Recipe;
}

export type ViewMode = 'mum' | 'cook';

export const MEAL_SLOTS = [
  'Monday dinner',
  'Tuesday dinner',
  'Wednesday dinner',
  'Thursday dinner',
  'Friday dinner',
  'Saturday lunch',
  'Saturday dinner',
  'Sunday lunch',
  'Sunday dinner',
] as const;

export const BOOK_SOURCES = [
  'All',
  'CSIRO Low-Carb Diabetes Every Day',
  'Csiro Low-carb Every Day',
  'The CSIRO Gut Care Guide',
  'The CSIRO Healthy Gut Diet',
  'The CSIRO healthy heart program',
  'The CSIRO Low-carb Diet Easy 100',
  'The CSIRO total wellbeing diet',
  'The CSIRO total wellbeing diet. Book 2',
  "The CSIRO Women's Health & Nutrition Guide",
  'The CSIRO and Baker IDI diabetes diet and lifestyle plan',
  'Fit With Healthy Fascia',
] as const;
