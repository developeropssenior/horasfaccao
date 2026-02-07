'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUsuario } from '@/hooks/useUsuario';
import { useRouter } from 'next/navigation';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calcularHorasDeMarcacoes } from '@/utils/calcularHoras';
import { parseDateToLocalStart } from '@/utils/parseDateLocal';

type PeriodoRelatorio = 'diario' | 'semanal' | 'mensal';

export default function RelatoriosPage() {
  const router = useRouter();
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

  const [periodoRelatorio, setPeriodoRelatorio] = useState<PeriodoRelatorio>('semanal');
  const [dataBase, setDataBase] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [funcionarioId, setFuncionarioId] = useState<string>('');

  const now = parseDateToLocalStart(dataBase);
  const { inicio, fim } =
    periodoRelatorio === 'diario'
      ? { inicio: startOfDay(now), fim: endOfDay(now) }
      : periodoRelatorio === 'semanal'
      ? { inicio: startOfWeek(now, { locale: ptBR }), fim: endOfWeek(now, { locale: ptBR }) }
      : { inicio: startOfMonth(now), fim: endOfMonth(now) };

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
    queryKey: ['marcacoes-relatorio', funcionarioId || 'todos', inicio.toISOString(), fim.toISOString()],
    queryFn: async () => {
      if (!usuario?.faccao_id) return [];
      const ids = funcionarioId
        ? [funcionarioId]
        : funcionarios.map((f) => f.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('marcacoes')
        .select('*')
        .in('usuario_id', ids)
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.faccao_id && funcionarios.length > 0,
  });

  const totalHoras = calcularHorasDeMarcacoes(marcacoes);

  const horasPorFuncionario = funcionarios.map((f) => {
    const m = marcacoes.filter((x) => x.usuario_id === f.id);
    return { nome: f.nome, horas: calcularHorasDeMarcacoes(m) };
  });

  useEffect(() => {
    if (funcionarios.length > 0 && !funcionarioId) {
      setFuncionarioId('');
    }
  }, [funcionarios, funcionarioId]);

  if (loadingUsuario || !usuario) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  const labelPeriodo =
    periodoRelatorio === 'diario'
      ? format(inicio, "dd/MM/yyyy", { locale: ptBR })
      : periodoRelatorio === 'semanal'
      ? `${format(inicio, 'dd/MM', { locale: ptBR })} - ${format(fim, 'dd/MM/yyyy', { locale: ptBR })}`
      : format(inicio, 'MMMM yyyy', { locale: ptBR });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Relatório de Horas</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
          <select
            value={periodoRelatorio}
            onChange={(e) => setPeriodoRelatorio(e.target.value as PeriodoRelatorio)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          >
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data base</label>
          <input
            type="date"
            value={dataBase}
            onChange={(e) => setDataBase(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Funcionário</label>
          <select
            value={funcionarioId}
            onChange={(e) => setFuncionarioId(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg min-w-[200px]"
          >
            <option value="">Todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="text-sm text-slate-600">Total de horas em {labelPeriodo}</p>
        <p className="text-3xl font-bold text-slate-800">
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
                  Funcionário
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                  Horas
                </th>
              </tr>
            </thead>
            <tbody>
              {horasPorFuncionario
                .filter((f) => f.horas > 0 || !funcionarioId)
                .map((f) => (
                  <tr key={f.nome} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{f.nome}</td>
                    <td className="px-4 py-3 text-right text-slate-800">
                      {f.horas.toFixed(2)}h
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
