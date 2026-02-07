import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API para verificar funcionários que não bateram ponto de saída.
 * Deve ser chamada por um cron job (ex: Vercel Cron, pg_cron, ou serviço externo)
 * no fim do expediente (ex: 18:00).
 *
 * Verifica: última marcação do dia é "entrada" e ainda não há "saída" correspondente.
 * Retorna lista de funcionários para envio de notificação por email (ex: Resend).
 */

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  const { data: marcacoes, error: marcError } = await supabase
    .from('marcacoes')
    .select('id, usuario_id, data_hora, tipo')
    .gte('data_hora', inicioDia.toISOString())
    .lte('data_hora', fimDia.toISOString())
    .order('data_hora', { ascending: true });

  if (marcError) {
    return NextResponse.json({ error: marcError.message }, { status: 500 });
  }

  const porUsuario = new Map<string, { tipo: string; data_hora: string }[]>();
  for (const m of marcacoes ?? []) {
    const arr = porUsuario.get(m.usuario_id) ?? [];
    arr.push({ tipo: m.tipo, data_hora: m.data_hora });
    porUsuario.set(m.usuario_id, arr);
  }

  const esquecidos: string[] = [];
  porUsuario.forEach((arr, usuarioId) => {
    const ultima = arr[arr.length - 1];
    if (ultima?.tipo === 'entrada') {
      esquecidos.push(usuarioId);
    }
  });

  if (esquecidos.length === 0) {
    return NextResponse.json({ ok: true, esquecidos: [], message: 'Nenhum ponto esquecido' });
  }

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .in('id', esquecidos);

  return NextResponse.json({
    ok: true,
    esquecidos: usuarios ?? [],
    message: `${esquecidos.length} funcionário(s) sem bater ponto de saída`,
  });
}
