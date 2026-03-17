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
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  prep_time_min: number | null;
  cook_time_min: number | null;
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

export type ViewMode = 'planner' | 'cook' | 'shopping' | 'resources';

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
  'CSIRO Low-Carb Every Day',
  'CSIRO Low-Carb Diet Easy 100',
  'CSIRO Gut Care Guide',
  'CSIRO Healthy Gut Diet',
  'CSIRO Healthy Heart Program',
  'CSIRO Total Wellbeing Diet',
  'CSIRO Total Wellbeing Diet: Book 2',
  "CSIRO Women's Health & Nutrition Guide",
  'CSIRO & Baker IDI Diabetes Diet & Lifestyle Plan',
] as const;
