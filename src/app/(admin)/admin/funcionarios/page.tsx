'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUsuario } from '@/hooks/useUsuario';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function FuncionariosPage() {
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

  const { data: funcionarios = [], isLoading } = useQuery({
    queryKey: ['funcionarios', usuario?.faccao_id],
    queryFn: async () => {
      if (!usuario?.faccao_id) return [];
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, valor_hora, ativo')
        .eq('faccao_id', usuario.faccao_id)
        .eq('tipo', 'funcionario')
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.faccao_id,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', valor_hora: '' });

  const criarMutation = useMutation({
    mutationFn: async (data: { nome: string; email: string; senha: string; valor_hora: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/criar-funcionario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar funcionário');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setShowModal(false);
      setForm({ nome: '', email: '', senha: '', valor_hora: '' });
      toast.success('Funcionário cadastrado com sucesso');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      nome,
      valor_hora,
      ativo,
    }: {
      id: string;
      nome: string;
      valor_hora: number;
      ativo: boolean;
    }) => {
      const { error } = await supabase
        .from('usuarios')
        .update({ nome, valor_hora, ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setEditingId(null);
      toast.success('Funcionário atualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      const f = funcionarios.find((x) => x.id === editingId);
      if (f)
        updateMutation.mutate({
          id: editingId,
          nome: form.nome,
          valor_hora: Number(form.valor_hora) || 0,
          ativo: f.ativo,
        });
    } else {
      criarMutation.mutate(form);
    }
  }

  function openEdit(f: { id: string; nome: string; email?: string; valor_hora: number }) {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      email: f.email ?? '',
      senha: '',
      valor_hora: String(f.valor_hora ?? 0),
    });
    setShowModal(true);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ nome: '', email: '', senha: '', valor_hora: '' });
    setShowModal(true);
  }

  if (loadingUsuario || !usuario) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Funcionários</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          Cadastrar Funcionário
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-600">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nome</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Email</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">R$/hora</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">{f.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{f.email}</td>
                  <td className="px-4 py-3 text-slate-800">
                    R$ {Number(f.valor_hora ?? 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        f.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(f)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        updateMutation.mutate({
                          id: f.id,
                          nome: f.nome,
                          valor_hora: Number(f.valor_hora ?? 0),
                          ativo: !f.ativo,
                        })
                      }
                      className="ml-3 text-slate-600 hover:underline text-sm"
                    >
                      {f.ativo ? 'Inativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Senha inicial
                  </label>
                  <input
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                    required={!editingId}
                    minLength={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor/hora (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor_hora}
                  onChange={(e) => setForm((p) => ({ ...p, valor_hora: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={criarMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingId ? 'Salvar' : 'Cadastrar'}
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
