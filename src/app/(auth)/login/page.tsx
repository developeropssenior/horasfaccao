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
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600">Carregando...</p>
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
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-black/5 border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Controle de Ponto
          </h1>
          <p className="text-slate-500 text-sm mt-1">Horas Facção</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-primary transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-primary transition-colors"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 min-h-[48px] bg-primary text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Não tem conta?{' '}
          <Link href="/registro-faccao" className="text-primary hover:underline font-medium">
            Cadastrar facção
          </Link>
        </p>
      </div>
    </div>
  );
}
