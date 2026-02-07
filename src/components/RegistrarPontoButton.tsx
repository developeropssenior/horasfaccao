'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface RegistrarPontoButtonProps {
  usuarioId: string;
  ultimaMarcacao: { tipo: string } | null;
  onSuccess?: () => void;
}

export function RegistrarPontoButton({
  usuarioId,
  ultimaMarcacao,
  onSuccess,
}: RegistrarPontoButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const proximoTipo: 'entrada' | 'saida' =
    ultimaMarcacao?.tipo === 'entrada' ? 'saida' : 'entrada';

  async function handleRegistrar() {
    setLoading(true);
    try {
      const { error } = await supabase.from('marcacoes').insert({
        usuario_id: usuarioId,
        tipo: proximoTipo,
      });
      if (error) throw error;
      toast.success(`Ponto registrado: ${proximoTipo === 'entrada' ? 'Entrada' : 'Saída'}`);
      onSuccess?.();
    } catch (err) {
      toast.error('Erro ao registrar ponto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRegistrar}
      disabled={loading}
      className="w-full min-h-[140px] md:min-h-[180px] text-xl md:text-2xl font-bold text-white bg-gradient-to-br from-primary to-indigo-700 hover:opacity-95 active:scale-[0.98] transition-all rounded-2xl shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 py-6"
    >
      {loading ? (
        <span className="animate-pulse">Registrando...</span>
      ) : (
        <>
          <svg
            className="w-10 h-10 md:w-12 md:h-12 opacity-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>REGISTRAR PONTO</span>
          <span className="text-base md:text-lg font-medium opacity-90">
            {proximoTipo === 'entrada' ? 'Entrada' : 'Saída'}
          </span>
        </>
      )}
    </button>
  );
}
