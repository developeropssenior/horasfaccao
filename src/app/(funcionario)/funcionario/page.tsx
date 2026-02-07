'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUsuario } from '@/hooks/useUsuario';
import { useMarcacoes, formatarDataHoraMarcacao } from '@/hooks/useMarcacoes';
import { useQueryClient } from '@tanstack/react-query';
import { RegistrarPontoButton } from '@/components/RegistrarPontoButton';
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
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Redirecionando para login...</p>
      </div>
    );
  }

  if (loadingUsuario || (!usuario && !errorUsuario)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  if (errorUsuario || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-slate-700 mb-4">
            Não foi possível carregar seus dados. Sua conta pode não estar configurada corretamente.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Entre em contato com o administrador ou faça logout para tentar novamente.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Sair e voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold text-slate-800">Olá, {usuario.nome}</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 bg-white rounded-xl shadow p-4">
            <p className="text-sm text-slate-600">Horas hoje</p>
            <p className="text-2xl font-bold text-slate-800">
              {formatarHoras(totalHorasHoje)}
            </p>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow p-4">
            <p className="text-sm text-slate-600">Horas esta semana</p>
            <p className="text-2xl font-bold text-slate-800">
              {formatarHoras(totalHorasSemana)}
            </p>
          </div>
        </div>
        <div className="flex-[0_0_50%]">
          <RegistrarPontoButton
            usuarioId={usuario.id}
            ultimaMarcacao={ultimaMarcacao}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['marcacoes'] })}
          />
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Marcações de hoje</h2>
          {marcacoesHoje.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhuma marcação hoje</p>
          ) : (
            <ul className="space-y-2">
              {marcacoesHoje.map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0"
                >
                  <span
                    className={
                      m.tipo === 'entrada'
                        ? 'text-green-600 font-medium'
                        : 'text-orange-600 font-medium'
                    }
                  >
                    {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                  <span className="text-slate-700">
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
