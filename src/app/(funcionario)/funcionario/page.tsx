"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUsuario } from '@/hooks/useUsuario';
import { useMarcacoes, formatarDataHoraMarcacao } from '@/hooks/useMarcacoes';
import { useQueryClient } from '@tanstack/react-query';
import { RegistrarPontoButton } from "@/components/RegistrarPontoButton";
import { LocalizacaoCard } from "@/components/LocalizacaoCard";
import { Button } from "@/components/ui/button";
import { LogOut, Bell } from "lucide-react";
import { calcularHorasDeMarcacoes, formatarHoras } from '@/utils/calcularHoras';
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FuncionarioPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user ? { id: user.id } : null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUser(session?.user ? { id: session.user.id } : null);
      }
    );
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: usuario, isLoading: loadingUsuario, isError: errorUsuario } = useUsuario(authUser?.id ?? null);
  const now = new Date();
  const inicioSemana = startOfWeek(now, { locale: ptBR });
  const fimSemana = endOfWeek(now, { locale: ptBR });
  const { marcacoes: marcacoesSemana } = useMarcacoes(
    usuario?.id ?? null,
    inicioSemana,
    fimSemana
  );

  const marcacoesHoje = marcacoesSemana.filter((m) =>
    isWithinInterval(new Date(m.data_hora), {
      start: startOfDay(now),
      end: endOfDay(now),
    })
  );

  const ultimaMarcacao = marcacoesSemana[marcacoesSemana.length - 1] ?? null;
  const totalHorasSemana = calcularHorasDeMarcacoes(marcacoesSemana);
  const totalHorasHoje = calcularHorasDeMarcacoes(marcacoesHoje);

  useEffect(() => {
    if (!authChecked) return;
    if (!authUser) {
      router.replace('/login');
      return;
    }
    if (usuario && usuario.tipo !== 'funcionario') {
      router.replace('/admin');
    }
  }, [usuario, authUser, authChecked, router]);

  if (!authChecked) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-medium">Carregando...</p>
      </div>
    );
  }
  if (!authUser) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-medium">Redirecionando para login...</p>
      </div>
    );
  }

  if (loadingUsuario || (!usuario && !errorUsuario)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-medium">Carregando...</p>
      </div>
    );
  }

  if (errorUsuario || !usuario) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-4">
        <div className="rounded-2xl border border-border bg-card shadow-card p-8 max-w-md w-full text-center">
          <p className="text-foreground mb-4">
            Não foi possível carregar seus dados. Sua conta pode não estar configurada corretamente.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Entre em contato com o administrador ou faça logout para tentar novamente.
          </p>
          <Button
            className="w-full"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            Sair e voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="bg-card border-b border-border py-4 px-4 pt-safe">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground truncate">
            Olá, {usuario.nome}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            className="text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-1.5" strokeWidth={2} />
            Sair
          </Button>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4 pb-safe overflow-y-auto">
        {/* Greeting / reminder */}
        <div className="rounded-xl border border-border bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary flex-shrink-0" strokeWidth={2} />
          <p className="text-sm text-foreground">
            Olá, {usuario.nome}! 👋 Não esqueça de registrar o ponto.
          </p>
        </div>

        {/* Location */}
        <LocalizacaoCard />

        {/* Punch button - compact */}
        <RegistrarPontoButton
          usuarioId={usuario.id}
          ultimaMarcacao={ultimaMarcacao}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["marcacoes"] })}
        />

        {/* Last punch info */}
        {ultimaMarcacao && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Última batida</p>
            <p className="text-base font-semibold text-foreground mt-1">
              {ultimaMarcacao.tipo === "entrada" ? "Entrada" : "Saída"} —{" "}
              {formatarDataHoraMarcacao(ultimaMarcacao.data_hora)}
            </p>
          </div>
        )}

        {/* Hours summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Horas hoje</p>
            <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">
              {formatarHoras(totalHorasHoje)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Horas esta semana</p>
            <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">
              {formatarHoras(totalHorasSemana)}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-semibold text-foreground mb-3 tracking-tight">
            Marcações de hoje
          </h2>
          {marcacoesHoje.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma marcação hoje</p>
          ) : (
            <ul className="space-y-2 max-h-[40vh] overflow-y-auto -mr-1 pr-1">
              {marcacoesHoje.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center text-sm py-3 border-b border-border last:border-0 gap-2"
                >
                  <span
                    className={
                      m.tipo === "entrada"
                        ? "text-emerald-600 font-medium"
                        : "text-amber-600 font-medium"
                    }
                  >
                    {m.tipo === "entrada" ? "Entrada" : "Saída"}
                  </span>
                  <span className="text-foreground text-right truncate">
                    {formatarDataHoraMarcacao(m.data_hora)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
