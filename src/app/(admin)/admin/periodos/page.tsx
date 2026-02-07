'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUsuario } from '@/hooks/useUsuario';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PeriodosPage() {
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

  const { data: periodos = [], isLoading } = useQuery({
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

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ data_inicio: '', data_fim: '' });

  const createMutation = useMutation({
    mutationFn: async (data: { data_inicio: string; data_fim: string }) => {
      if (!usuario?.faccao_id) throw new Error('Sem facção');
      const { error } = await supabase.from('periodos').insert({
        faccao_id: usuario.faccao_id,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        fechado: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      setShowModal(false);
      setForm({ data_inicio: '', data_fim: '' });
      toast.success('Período criado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleFechadoMutation = useMutation({
    mutationFn: async ({ id, fechado }: { id: string; fechado: boolean }) => {
      const { error } = await supabase
        .from('periodos')
        .update({ fechado })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      toast.success('Período atualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Períodos de Apuração</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:opacity-90 min-h-[44px]"
        >
          Novo Período
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Carregando...</p>
      ) : (
        <div className="hidden md:block bg-white rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
                  Início
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
                  Fim
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {periodos.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">
                    {format(new Date(p.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {format(new Date(p.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        p.fechado ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {p.fechado ? 'Fechado' : 'Aberto'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/folha-pagamento?periodo=${p.id}`}
                      className="text-blue-600 hover:underline text-sm mr-3"
                    >
                      Folha
                    </Link>
                    <button
                      onClick={() =>
                        toggleFechadoMutation.mutate({
                          id: p.id,
                          fechado: !p.fechado,
                        })
                      }
                      className="text-slate-600 hover:underline text-sm"
                    >
                      {p.fechado ? 'Reabrir' : 'Fechar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {periodos.length === 0 && (
            <p className="p-8 text-center text-slate-500">
              Nenhum período cadastrado. Crie um período para gerar folhas de pagamento.
            </p>
          )}
        </div>
      )}
      {!isLoading && (
        <div className="md:hidden">
          {periodos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-8 text-center text-slate-500">
              Nenhum período cadastrado. Crie um período para gerar folhas de pagamento.
            </div>
          ) : (
            <div className="space-y-3">
          {periodos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-lg shadow-black/5 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-800 font-medium">
                  {format(new Date(p.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(p.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    p.fechado ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {p.fechado ? 'Fechado' : 'Aberto'}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/folha-pagamento?periodo=${p.id}`}
                  className="flex-1 py-2 text-center text-primary border border-primary/30 rounded-lg text-sm font-medium"
                >
                  Folha
                </Link>
                <button
                  onClick={() =>
                    toggleFechadoMutation.mutate({
                      id: p.id,
                      fechado: !p.fechado,
                    })
                  }
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                >
                  {p.fechado ? 'Reabrir' : 'Fechar'}
                </button>
              </div>
            </div>
          ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-auto max-h-[90dvh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Novo Período</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm((prev) => ({ ...prev, data_inicio: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => setForm((prev) => ({ ...prev, data_fim: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-primary text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 min-h-[44px]"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
