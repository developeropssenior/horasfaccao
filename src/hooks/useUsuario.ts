'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Usuario } from '@/types/database';

export function useUsuario(authUserId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['usuario', authUserId],
    queryFn: async () => {
      if (!authUserId) return null;
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Usuario;
    },
    enabled: !!authUserId,
  });
}
