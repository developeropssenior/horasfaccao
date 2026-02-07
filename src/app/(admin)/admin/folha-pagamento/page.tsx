'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUsuario } from '@/hooks/useUsuario';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportarPDF, exportarExcel, type ItemFolha } from '@/components/folha/ExportarFolha';
import { calcularHorasDeMarcacoes } from '@/utils/calcularHoras';
import { parseDateToLocalStart, parseDateToLocalEnd } from '@/utils/parseDateLocal';

function FolhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const periodoIdParam = searchParams.get('periodo');
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

  const { data: periodos = [] } = useQuery({
    queryKey: ['periodos', usuario?.faccao_id],
    queryFn: async () => {
      if (!usuario?.faccao_id) return [];
      const { data, error } = await supabase
        .from('periodos')
        .select('*')
        .eq('faccao_id', usuario.faccao_id)
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.faccao_id,
  });

  const [periodoId, setPeriodoId] = useState(periodoIdParam ?? '');
  const [folhaGerada, setFolhaGerada] = useState<ItemFolha[]>([]);
  const [periodoLabel, setPeriodoLabel] = useState('');

  const periodoSelecionado = periodos.find((p) => p.id === periodoId);

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios', usuario?.faccao_id],
    queryFn: async () => {
      if (!usuario?.faccao_id) return [];
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, valor_hora')
        .eq('faccao_id', usuario.faccao_id)
        .eq('tipo', 'funcionario')
        .eq('ativo', true);
      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.faccao_id,
  });

  const { data: marcacoes = [] } = useQuery({
    queryKey: ['marcacoes-folha', periodoId, funcionarios.map((f) => f.id)],
    queryFn: async () => {
      if (!periodoSelecionado || funcionarios.length === 0) return [];
      const inicio = parseDateToLocalStart(String(periodoSelecionado.data_inicio));
      const fim = parseDateToLocalEnd(String(periodoSelecionado.data_fim));
      const { data, error } = await supabase
        .from('marcacoes')
        .select('*')
        .in('usuario_id', funcionarios.map((f) => f.id))
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!periodoSelecionado && funcionarios.length > 0,
  });

  useEffect(() => {
    if (periodoIdParam && !periodoId) setPeriodoId(periodoIdParam);
  }, [periodoIdParam, periodoId]);

  useEffect(() => {
    if (!periodoSelecionado || funcionarios.length === 0 || marcacoes.length === 0) {
      if (periodoSelecionado && funcionarios.length > 0) {
        const itens: ItemFolha[] = funcionarios.map((f) => ({
          nome: f.nome,
          total_horas: 0,
          valor_hora: Number(f.valor_hora ?? 0),
          total_pagar: 0,
        }));
        setFolhaGerada(itens);
        setPeriodoLabel(
          periodoSelecionado
            ? `${format(new Date(periodoSelecionado.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(periodoSelecionado.data_fim), 'dd/MM/yyyy', { locale: ptBR })}`
            : ''
        );
      }
      return;
    }

    const itens: ItemFolha[] = funcionarios.map((f) => {
      const marcacoesUsuario = marcacoes.filter((m) => m.usuario_id === f.id);
      const totalHoras = calcularHorasDeMarcacoes(marcacoesUsuario);
      const valorHora = Number(f.valor_hora ?? 0);
      const totalPagar = totalHoras * valorHora;
      return {
        nome: f.nome,
        total_horas: totalHoras,
        valor_hora: valorHora,
        total_pagar: totalPagar,
      };
    });
    setFolhaGerada(itens);
    setPeriodoLabel(
      `${format(new Date(periodoSelecionado.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(periodoSelecionado.data_fim), 'dd/MM/yyyy', { locale: ptBR })}`
    );
  }, [periodoSelecionado, funcionarios, marcacoes]);

  const gerarMutation = useMutation({
    mutationFn: async () => {
      if (!periodoSelecionado || !usuario?.faccao_id) throw new Error('Selecione um período');
      await supabase.from('folhas_pagamento').delete().eq('periodo_id', periodoSelecionado.id);
      const inserts = folhaGerada.map((item, idx) => {
        const u = funcionarios[idx];
        if (!u) throw new Error('Funcionário não encontrado');
        return {
          periodo_id: periodoSelecionado.id,
          usuario_id: u.id,
          total_horas: item.total_horas,
          valor_hora: item.valor_hora,
          total_pagar: item.total_pagar,
        };
      });
      const { error } = await supabase.from('folhas_pagamento').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas'] });
      toast.success('Folha gerada e salva');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalGeral = folhaGerada.reduce((a, b) => a + b.total_pagar, 0);

  if (loadingUsuario || !usuario) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Folha de Pagamento</h1>
        <div className="flex gap-3 items-center">
          <select
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg min-w-[220px]"
          >
            <option value="">Selecione o período</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {format(new Date(p.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                {format(new Date(p.data_fim), 'dd/MM/yyyy', { locale: ptBR })}{' '}
                {p.fechado ? '(Fechado)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => gerarMutation.mutate()}
            disabled={!periodoId || gerarMutation.isPending}
            className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 min-h-[44px]"
          >
            {gerarMutation.isPending ? 'Gerando...' : 'Gerar/Salvar Folha'}
          </button>
          {folhaGerada.length > 0 && (
            <>
              <button
                onClick={() => exportarPDF(folhaGerada, periodoLabel)}
                className="px-4 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700"
              >
                Exportar PDF
              </button>
              <button
                onClick={() => exportarExcel(folhaGerada, periodoLabel)}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Exportar Excel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nome</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                Horas Trabalhadas
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                R$/hora
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                Total a Pagar
              </th>
            </tr>
          </thead>
          <tbody>
            {folhaGerada.map((item, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800">{item.nome}</td>
                <td className="px-4 py-3 text-right text-slate-800">
                  {item.total_horas.toFixed(2)}h
                </td>
                <td className="px-4 py-3 text-right text-slate-800">
                  R$ {item.valor_hora.toFixed(2).replace('.', ',')}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  R$ {item.total_pagar.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {folhaGerada.length > 0 && (
          <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
            Total Geral: R$ {totalGeral.toFixed(2).replace('.', ',')}
          </div>
        )}
        {folhaGerada.length === 0 && periodoId && (
          <p className="p-8 text-center text-slate-500">
            Selecione um período e clique em Gerar para calcular a folha
          </p>
        )}
        {!periodoId && (
          <p className="p-8 text-center text-slate-500">Selecione um período</p>
        )}
      </div>
      {folhaGerada.length === 0 && (
        <div className="md:hidden bg-white rounded-2xl shadow-lg shadow-black/5 p-8 text-center text-slate-500">
          {!periodoId ? 'Selecione um período' : 'Clique em Gerar para calcular a folha'}
        </div>
      )}
      {folhaGerada.length > 0 && (
        <div className="md:hidden space-y-3">
          {folhaGerada.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg shadow-black/5 p-4">
              <div className="font-medium text-slate-800 mb-2">{item.nome}</div>
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>Horas</span>
                <span>{item.total_horas.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>R$/hora</span>
                <span>R$ {item.valor_hora.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-800 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>R$ {item.total_pagar.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          ))}
          <div className="bg-slate-50 rounded-2xl p-4 font-bold text-slate-800">
            Total Geral: R$ {totalGeral.toFixed(2).replace('.', ',')}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FolhaPagamentoPage() {
  return (
    <Suspense fallback={<p className="text-slate-600">Carregando...</p>}>
      <FolhaContent />
    </Suspense>
  );
}
