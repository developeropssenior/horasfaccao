"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Cadastrar Facção
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure sua facção e crie a conta do administrador
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nomeFaccao"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Nome da Facção
            </label>
            <Input
              id="nomeFaccao"
              type="text"
              value={nomeFaccao}
              onChange={(e) => setNomeFaccao(e.target.value)}
              required
              placeholder="Ex: Facção Costura ABC"
            />
          </div>
          <div>
            <label
              htmlFor="nomeAdmin"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Nome do Administrador
            </label>
            <Input
              id="nomeAdmin"
              type="text"
              value={nomeAdmin}
              onChange={(e) => setNomeAdmin(e.target.value)}
              required
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email (será usado para login)
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@faccao.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Confirmar Senha
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
