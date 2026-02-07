"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
      <div className="min-h-[200px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Funcionários
        </h1>
        <Button onClick={openCreate}>Cadastrar Funcionário</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground font-medium">Carregando...</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-card">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                    Nome
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                    R$/hora
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f) => (
                  <tr key={f.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-foreground">{f.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.email}</td>
                    <td className="px-4 py-3 text-foreground">
                      R$ {Number(f.valor_hora ?? 0).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={f.ativo ? "success" : "secondary"}>
                        {f.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => openEdit(f)}
                        className="min-h-[44px]"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateMutation.mutate({
                            id: f.id,
                            nome: f.nome,
                            valor_hora: Number(f.valor_hora ?? 0),
                            ativo: !f.ativo,
                          })
                        }
                        className="ml-3 text-muted-foreground min-h-[44px]"
                      >
                        {f.ativo ? "Inativar" : "Ativar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {funcionarios.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-card"
              >
                <div className="font-medium text-foreground">{f.nome}</div>
                <p className="text-sm text-muted-foreground truncate">{f.email}</p>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">
                    R$ {Number(f.valor_hora ?? 0).toFixed(2).replace(".", ",")}/h
                  </span>
                  <Badge variant={f.ativo ? "success" : "secondary"}>
                    {f.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEdit(f)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      updateMutation.mutate({
                        id: f.id,
                        nome: f.nome,
                        valor_hora: Number(f.valor_hora ?? 0),
                        ativo: !f.ativo,
                      })
                    }
                  >
                    {f.ativo ? "Inativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-card shadow-xl w-full max-w-md p-6 my-auto max-h-[90dvh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-4 tracking-tight">
              {editingId ? "Editar Funcionário" : "Cadastrar Funcionário"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nome
                </label>
                <Input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  disabled={!!editingId}
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Senha inicial
                  </label>
                  <Input
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                    required={!editingId}
                    minLength={6}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Valor/hora (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.valor_hora}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, valor_hora: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={criarMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
