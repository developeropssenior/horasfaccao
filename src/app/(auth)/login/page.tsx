'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/');
      setCheckingAuth(false);
    });
  }, [router, supabase.auth]);

  if (checkingAuth) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-medium">Carregando...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('tipo')
        .eq('auth_user_id', data.user!.id)
        .maybeSingle();
      if (!usuario) {
        setError('Conta não configurada. Entre em contato com o administrador.');
        return;
      }
      if (usuario.tipo === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/funcionario');
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Horas Facção
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle de ponto e folha de pagamento
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors bg-background"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors bg-background"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 min-h-[48px] bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity active:scale-[0.98]"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            href="/registro-faccao"
            className="text-primary hover:underline font-medium"
          >
            Cadastrar facção
          </Link>
        </p>
      </div>
    </div>
  );
}
