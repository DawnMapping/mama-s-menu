import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Recipe } from '@/lib/types';

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as Recipe[];
    },
  });
}
