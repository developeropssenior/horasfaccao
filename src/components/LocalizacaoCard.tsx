"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number;
  loading: boolean;
  error: string | null;
}

export function LocalizacaoCard() {
  const [location, setLocation] = useState<LocationState>({
    lat: 0,
    lng: 0,
    accuracy: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((p) => ({ ...p, loading: false, error: "Geolocalização não suportada" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 0,
          loading: false,
          error: null,
        });
      },
      () => {
        setLocation((p) => ({
          ...p,
          loading: false,
          error: "Não foi possível obter a localização",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const osmUrl =
    location.lat && location.lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`
      : null;

  const openInMaps = () => {
    if (location.lat && location.lng) {
      window.open(
        `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        "_blank"
      );
    }
  };

  if (location.loading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
        <div className="h-32 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={2} />
          <span className="ml-2 text-sm text-muted-foreground">Obtendo localização...</span>
        </div>
        <div className="p-3">
          <p className="text-xs text-muted-foreground">Permita o acesso à localização no navegador</p>
        </div>
      </div>
    );
  }

  if (location.error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
          <span className="text-sm font-medium">{location.error}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Verifique se permitiu o acesso à localização nas configurações do navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <MapPin className="h-4 w-4 text-primary" strokeWidth={2} />
        <span className="text-sm font-semibold text-foreground">Localização atual</span>
      </div>
      <div className="relative h-36 bg-slate-100">
        {osmUrl && (
          <iframe
            title="Mapa de localização"
            src={osmUrl}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          Precisão:{" "}
          <span className="font-medium text-foreground">
            {location.accuracy < 1000
              ? `${Math.round(location.accuracy)} metros`
              : `${(location.accuracy / 1000).toFixed(1)} km`}
          </span>
        </p>
        <button
          type="button"
          onClick={openInMaps}
          className="text-xs text-primary font-medium hover:underline"
        >
          Abrir no Google Maps →
        </button>
      </div>
    </div>
  );
}
