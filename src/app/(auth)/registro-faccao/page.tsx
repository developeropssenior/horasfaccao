'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroFaccaoPage() {
  const [nomeFaccao, setNomeFaccao] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/registro-faccao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeFaccao,
          nomeAdmin,
          email,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');

      router.replace('/login');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-black/5 border border-slate-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Cadastrar Facção
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure sua facção e crie a conta do administrador
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nomeFaccao" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome da Facção
            </label>
            <input
              id="nomeFaccao"
              type="text"
              value={nomeFaccao}
              onChange={(e) => setNomeFaccao(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-primary transition-colors"
              placeholder="Ex: Facção Costura ABC"
            />
          </div>
          <div>
            <label htmlFor="nomeAdmin" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome do Administrador
            </label>
            <input
              id="nomeAdmin"
              type="text"
              value={nomeAdmin}
              onChange={(e) => setNomeAdmin(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-primary transition-colors"
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email (será usado para login)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-primary transition-colors"
              placeholder="admin@faccao.com"
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
              minLength={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-primary transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
