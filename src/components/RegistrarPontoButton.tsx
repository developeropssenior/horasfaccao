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
      className="w-full min-h-[200px] md:min-h-[280px] text-2xl md:text-3xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all rounded-2xl shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        'Registrando...'
      ) : (
        <>
          REGISTRAR PONTO
          <br />
          <span className="text-lg md:text-xl font-medium opacity-90">
            ({proximoTipo === 'entrada' ? 'Entrada' : 'Saída'})
          </span>
        </>
      )}
    </button>
  );
}
