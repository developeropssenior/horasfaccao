"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Clock } from "lucide-react";

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

  const proximoTipo: "entrada" | "saida" =
    ultimaMarcacao?.tipo === "entrada" ? "saida" : "entrada";

  async function handleRegistrar() {
    setLoading(true);
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      let precisao_metros: number | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              });
            }
          );
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          precisao_metros = position.coords.accuracy ?? null;
        } catch {
          // Segue sem localização se o usuário negar ou falhar
        }
      }

      const { error } = await supabase.from("marcacoes").insert({
        usuario_id: usuarioId,
        tipo: proximoTipo,
        ...(latitude != null && longitude != null && {
          latitude,
          longitude,
          precisao_metros,
        }),
      });
      if (error) throw error;
      toast.success(
        `Ponto registrado: ${proximoTipo === "entrada" ? "Entrada" : "Saída"}`
      );
      onSuccess?.();
    } catch (err) {
      toast.error("Erro ao registrar ponto");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRegistrar}
      disabled={loading}
      className="w-full h-14 md:h-16 px-6 text-base md:text-lg font-bold text-primary-foreground bg-primary hover:opacity-95 active:scale-[0.98] transition-all rounded-xl shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 border-0"
    >
      {loading ? (
        <span className="animate-pulse font-medium">Registrando...</span>
      ) : (
        <>
          <Clock className="w-6 h-6 md:w-7 md:h-7 opacity-95" strokeWidth={2} />
          <span className="tracking-wide">REGISTRAR PONTO</span>
          <span className="text-sm md:text-base font-semibold opacity-90">
            ({proximoTipo === "entrada" ? "Entrada" : "Saída"})
          </span>
        </>
      )}
    </button>
  );
}
