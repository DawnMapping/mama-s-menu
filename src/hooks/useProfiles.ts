import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  name: string;
  daily_calories_target: number;
  daily_protein_g_target: number;
  daily_carbs_g_target: number;
  daily_fat_g_target: number;
  daily_fibre_g_target: number;
  avatar_emoji: string;
  created_at: string;
}

const ACTIVE_PROFILE_KEY = 'active-profile-id';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useActiveProfileId() {
  const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
  return stored;
}

export function setActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<Profile> & { id: string }) => {
      const { id, ...updates } = profile;
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}
