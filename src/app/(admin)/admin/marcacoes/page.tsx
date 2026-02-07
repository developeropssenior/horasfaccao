'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUsuario } from '@/hooks/useUsuario';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calcularHorasDeMarcacoes } from '@/utils/calcularHoras';
import { parseDateToLocalStart, parseDateToLocalEnd } from '@/utils/parseDateLocal';

export default function MarcacoesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user ? { id: user.id } : null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: usuario, isLoading: loadingUsuario } = useUsuario(authUser?.id ?? null);

  useEffect(() => {
    if (!loadingUsuario && !usuario && authUser) {
      router.replace('/login');
    }
  }, [loadingUsuario, usuario, authUser, router]);
  const [funcionarioId, setFuncionarioId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState(() =>
    format(startOfDay(new Date()), 'yyyy-MM-dd')
  );
  const [dataFim, setDataFim] = useState(() =>
    format(endOfDay(new Date()), 'yyyy-MM-dd')
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios', usuario?.faccao_id],
    queryFn: async () => {
      if (!usuario?.faccao_id) return [];
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('faccao_id', usuario.faccao_id)
        .eq('tipo', 'funcionario')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.faccao_id,
  });

  const { data: marcacoes = [], isLoading } = useQuery({
    queryKey: ['marcacoes-admin', funcionarioId, dataInicio, dataFim],
    queryFn: async () => {
      if (!funcionarioId) return [];
      const inicio = parseDateToLocalStart(dataInicio);
      const fim = parseDateToLocalEnd(dataFim);
      const { data, error } = await supabase
        .from('marcacoes')
        .select('*')
        .eq('usuario_id', funcionarioId)
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!funcionarioId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data_hora,
    }: {
      id: string;
      data_hora: string;
    }) => {
      const { error } = await supabase
        .from('marcacoes')
        .update({
          data_hora,
          editado_por: usuario?.id ?? undefined,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcacoes-admin'] });
      setEditingId(null);
      toast.success('Marcação atualizada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalHoras = calcularHorasDeMarcacoes(marcacoes);

  useEffect(() => {
    if (funcionarios.length > 0 && !funcionarioId) {
      setFuncionarioId(funcionarios[0].id);
    }
  }, [funcionarios, funcionarioId]);

  if (loadingUsuario || !usuario) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Marcações</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Funcionário</label>
          <select
            value={funcionarioId}
            onChange={(e) => setFuncionarioId(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg min-w-[200px]"
          >
            <option value="">Selecione...</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <p className="text-sm text-slate-600">Total de horas no período</p>
        <p className="text-2xl font-bold text-slate-800">
          {totalHoras.toFixed(2)}h ({Math.floor(totalHoras)}h {Math.round((totalHoras % 1) * 60)}m)
        </p>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
                  Data/Hora
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Tipo</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {marcacoes.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">
                    {editingId === m.id ? (
                      <input
                        type="datetime-local"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-1 border border-slate-300 rounded"
                      />
                    ) : (
                      format(parseISO(m.data_hora), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        m.tipo === 'entrada'
                          ? 'text-green-600 font-medium'
                          : 'text-orange-600 font-medium'
                      }
                    >
                      {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === m.id ? (
                      <>
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: m.id,
                              data_hora: new Date(editValue).toISOString(),
                            })
                          }
                          className="text-blue-600 hover:underline text-sm mr-2"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-slate-600 hover:underline text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditValue(format(parseISO(m.data_hora), "yyyy-MM-dd'T'HH:mm"));
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {marcacoes.length === 0 && (
            <p className="p-8 text-center text-slate-500">
              Nenhuma marcação no período selecionado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
