import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Book {
  id: string;
  title: string;
  book_source: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
}

export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as Book[];
    },
  });
}

export function getBookFileUrl(filePath: string) {
  const { data } = supabase.storage.from('books').getPublicUrl(filePath);
  return data.publicUrl;
}
