/**
 * Converte string "yyyy-MM-dd" em Date com meia-noite (início do dia) em horário local.
 * Evita o bug de new Date("yyyy-MM-dd") ser interpretado como UTC.
 */
export function parseDateToLocalStart(dateStr: string): Date {
  const [y, m, d] = dateStr.split(/[-T]/).map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/**
 * Converte string "yyyy-MM-dd" em Date com 23:59:59.999 (fim do dia) em horário local.
 */
export function parseDateToLocalEnd(dateStr: string): Date {
  const [y, m, d] = dateStr.split(/[-T]/).map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
}
