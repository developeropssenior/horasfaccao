import type { Marcacao } from '@/types/database';
import { differenceInMinutes, parseISO } from 'date-fns';

export function calcularHorasDeMarcacoes(marcacoes: Marcacao[]): number {
  if (marcacoes.length < 2) return 0;
  const sorted = [...marcacoes].sort(
    (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
  );
  let totalMinutos = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].tipo === 'entrada' && sorted[i + 1].tipo === 'saida') {
      const inicio = parseISO(sorted[i].data_hora);
      const fim = parseISO(sorted[i + 1].data_hora);
      totalMinutos += differenceInMinutes(fim, inicio);
    }
  }
  return totalMinutos / 60;
}

export function formatarHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
