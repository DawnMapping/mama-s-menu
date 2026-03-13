import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShoppingListItem {
  id: string;
  ingredient: string;
  recipe_id: string | null;
  meal_day: string | null;
  checked: boolean;
  created_at: string;
}

export function useShoppingList() {
  return useQuery({
    queryKey: ['shopping-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .order('checked')
        .order('ingredient');
      if (error) throw error;
      return data as ShoppingListItem[];
    },
  });
}

export function useToggleShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ checked })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-list'] }),
  });
}

export function useGenerateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Get locked meals with recipes
      const { data: meals, error: mealsError } = await supabase
        .from('locked_meals')
        .select('*, recipes(*)');
      if (mealsError) throw mealsError;

      // Clear existing list
      await supabase.from('shopping_list_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Parse ingredients from locked meals and insert
      const items: { ingredient: string; recipe_id: string; meal_day: string }[] = [];
      for (const meal of meals || []) {
        const recipe = meal.recipes as any;
        if (!recipe?.ingredients) continue;
        const lines = recipe.ingredients
          .split('\n')
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0);
        for (const line of lines) {
          items.push({
            ingredient: line,
            recipe_id: recipe.id,
            meal_day: meal.day,
          });
        }
      }

      if (items.length > 0) {
        const { error } = await supabase.from('shopping_list_items').insert(items);
        if (error) throw error;
      }

      return items.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-list'] }),
  });
}

export function useClearShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-list'] }),
  });
}
