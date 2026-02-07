'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Marcacao } from '@/types/database';
import { format } from 'date-fns';
import { parseDateToLocalEnd } from '@/utils/parseDateLocal';
import { ptBR } from 'date-fns/locale';

export function useMarcacoes(
  usuarioId: string | null,
  dataInicio?: Date,
  dataFim?: Date
) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: marcacoes = [], ...rest } = useQuery({
    queryKey: ['marcacoes', usuarioId, dataInicio?.toISOString(), dataFim?.toISOString()],
    queryFn: async () => {
      if (!usuarioId) return [];
      let query = supabase
        .from('marcacoes')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('data_hora', { ascending: true });
      if (dataInicio) {
        query = query.gte('data_hora', dataInicio.toISOString());
      }
      if (dataFim) {
        const fimStr = format(dataFim, 'yyyy-MM-dd');
        const fim = parseDateToLocalEnd(fimStr);
        query = query.lte('data_hora', fim.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Marcacao[];
    },
    enabled: !!usuarioId,
  });

  useEffect(() => {
    if (!usuarioId) return;
    const channel = supabase
      .channel('marcacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marcacoes',
          filter: `usuario_id=eq.${usuarioId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['marcacoes', usuarioId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, queryClient]);

  return { marcacoes, ...rest };
}

export function formatarDataHoraMarcacao(dataHora: string): string {
  return format(new Date(dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}
