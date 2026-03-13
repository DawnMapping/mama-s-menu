import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LockedMeal } from '@/lib/types';

export function useLockedMeals() {
  return useQuery({
    queryKey: ['locked-meals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locked_meals')
        .select('*, recipes(*)')
        .order('day');
      if (error) throw error;
      return data as LockedMeal[];
    },
  });
}

export function useLockMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meal: { recipe_id: string; day: string; warnings_at_lock: string[]; notes?: string }) => {
      // Remove existing meal for that day first
      await supabase.from('locked_meals').delete().eq('day', meal.day);
      const { data, error } = await supabase.from('locked_meals').insert(meal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locked-meals'] }),
  });
}

export function useUnlockMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locked_meals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locked-meals'] }),
  });
}
